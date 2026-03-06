package pcgen2.pipeline

import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.int
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import pcgen2.data.Ability
import pcgen2.data.Ancestry
import pcgen2.data.AttackProficiencies
import pcgen2.data.Background
import pcgen2.data.ClassFeature
import pcgen2.data.ClassFeatureGrant
import pcgen2.data.DefenseProficiencies
import pcgen2.data.Feat
import pcgen2.data.FeatGrant
import pcgen2.data.Heritage
import pcgen2.data.OtherProficiency
import pcgen2.data.PCClass
import pcgen2.data.Predicate
import pcgen2.data.Publication
import pcgen2.data.RuleElement
import pcgen2.data.RuleElementSerializer
import pcgen2.data.SavingThrows
import pcgen2.data.Size
import pcgen2.data.Spell
import pcgen2.data.SpellArea
import pcgen2.data.SpellDamage
import pcgen2.data.SpellDefense
import pcgen2.data.Traits
import java.io.File
import kotlin.system.exitProcess

private val jsonIn = Json { ignoreUnknownKeys = true; isLenient = true }
private val jsonOut = Json { prettyPrint = false; encodeDefaults = false }

private const val TARGET_PUBLICATION = "Pathfinder Player Core"

fun main(args: Array<String>) {
    if (args.size != 2) {
        System.err.println("usage: ingest <foundry-packs-dir> <output-dir>")
        exitProcess(1)
    }
    val source = File(args[0])
    val dest = File(args[1])
    require(source.isDirectory) { "source not a directory: $source" }

    println("Ingesting Foundry pf2e → $dest")
    println("Filter: publication.title == \"$TARGET_PUBLICATION\"")

    // First pass: collect names for prerequisite classification
    val featureNames = collectNames(source.resolve("class-features"))
    val featNames = collectNames(source.resolve("feats"))
    PrereqParser.configure(featureNames, featNames)
    println("Name index: ${featureNames.size} features, ${featNames.size} feats")

    // Collect class-feature slugs transitively referenced by Player Core classes.
    // Foundry deduplicates shared features (Weapon Specialization, etc.) across books,
    // so a feature used by Fighter may be tagged "Guns & Gears" if Gunslinger entered it first.
    val referencedFeatureSlugs = collectClassFeatureRefs(source.resolve("classes"))

    var total = 0
    val stats = mutableMapOf<String, Int>()

    total += ingest(source.resolve("ancestries"), dest.resolve("ancestries"), Ancestry.serializer(), ::transformAncestry).also { stats["ancestries"] = it }
    total += ingest(source.resolve("heritages"), dest.resolve("heritages"), Heritage.serializer(), ::transformHeritage).also { stats["heritages"] = it }
    total += ingest(source.resolve("backgrounds"), dest.resolve("backgrounds"), Background.serializer(), ::transformBackground).also { stats["backgrounds"] = it }
    total += ingest(source.resolve("classes"), dest.resolve("classes"), PCClass.serializer(), ::transformClass).also { stats["classes"] = it }
    total += ingest(
        source.resolve("class-features"), dest.resolve("classfeatures"), ClassFeature.serializer(), ::transformClassFeature,
        includeIf = { slug, _ -> slug in referencedFeatureSlugs },
    ).also { stats["classfeatures"] = it }
    total += ingest(source.resolve("feats"), dest.resolve("feats"), Feat.serializer(), ::transformFeat).also { stats["feats"] = it }
    total += ingest(source.resolve("spells"), dest.resolve("spells"), Spell.serializer(), ::transformSpell).also { stats["spells"] = it }

    println()
    stats.forEach { (k, v) -> println("  %-14s %4d".format("$k:", v)) }
    println("  %-14s %4d".format("total:", total))
    println()
    reportPrereqStats()
}

// ============================================================================
// Pack traversal
// ============================================================================

private fun collectNames(dir: File): Set<String> =
    dir.walk()
        .filter { it.isFile && it.extension == "json" && !it.name.startsWith("_") }
        .mapNotNull { f ->
            runCatching {
                val root = jsonIn.parseToJsonElement(f.readText()).jsonObject
                if (root.pubTitle() != TARGET_PUBLICATION) return@runCatching null
                root["name"]?.jsonPrimitive?.content
            }.getOrNull()
        }
        .toSet()

/** Slugs of class-features referenced by Player Core classes (via items[].uuid). */
private fun collectClassFeatureRefs(classesDir: File): Set<String> =
    classesDir.walk()
        .filter { it.isFile && it.extension == "json" && !it.name.startsWith("_") }
        .flatMap { f ->
            val root = runCatching { jsonIn.parseToJsonElement(f.readText()).jsonObject }.getOrNull()
                ?: return@flatMap emptySequence()
            if (root.pubTitle() != TARGET_PUBLICATION) return@flatMap emptySequence()
            root["system"]?.jsonObject?.get("items")?.jsonObject?.values?.asSequence()
                ?.mapNotNull { it.jsonObject["uuid"]?.jsonPrimitive?.content?.substringAfter(".Item.")?.slugify() }
                ?: emptySequence()
        }
        .toSet()

private fun <T : Any> ingest(
    srcDir: File,
    destDir: File,
    serializer: KSerializer<T>,
    transform: (String, JsonObject) -> T,
    includeIf: (slug: String, root: JsonObject) -> Boolean = { _, _ -> false },
): Int {
    destDir.mkdirs()
    val slugs = mutableListOf<String>()

    srcDir.walk()
        .filter { it.isFile && it.extension == "json" && !it.name.startsWith("_") }
        .forEach { file ->
            val root = runCatching { jsonIn.parseToJsonElement(file.readText()).jsonObject }
                .getOrElse {
                    System.err.println("  skip (malformed): ${file.path} — ${it.message}")
                    return@forEach
                }
            val slug = file.nameWithoutExtension
            if (root.pubTitle() != TARGET_PUBLICATION && !includeIf(slug, root)) return@forEach

            val item = runCatching { transform(slug, root) }
                .getOrElse {
                    System.err.println("  FAIL: $slug — ${it.message}")
                    return@forEach
                }

            destDir.resolve("$slug.json").writeText(jsonOut.encodeToString(serializer, item))
            slugs += slug
        }

    slugs.sort()
    destDir.resolve("_index.txt").writeText(slugs.joinToString("\n"))
    return slugs.size
}

// ============================================================================
// Per-type transforms
// ============================================================================

private fun transformAncestry(slug: String, root: JsonObject): Ancestry {
    val sys = root.sys()
    return Ancestry(
        slug = slug,
        name = root.str("name"),
        hp = sys.int("hp"),
        speed = sys.int("speed"),
        size = Size.entries.first { it.slug == sys.str("size") },
        vision = sys.str("vision"),
        boosts = sys.boosts("boosts"),
        flaws = sys.boosts("flaws"),
        languages = sys.obj("languages").arr("value").map { it.jsonPrimitive.content },
        additionalLanguages = sys.obj("additionalLanguages").intOr("count", 0),
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformHeritage(slug: String, root: JsonObject): Heritage {
    val sys = root.sys()
    val anc = sys["ancestry"]
    return Heritage(
        slug = slug,
        name = root.str("name"),
        ancestrySlug = if (anc == null || anc is JsonNull) null else anc.jsonObject["slug"]?.jsonPrimitive?.content,
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformBackground(slug: String, root: JsonObject): Background {
    val sys = root.sys()
    val ts = sys["trainedSkills"]?.jsonObject
    val granted = sys["items"]?.jsonObject?.values?.firstOrNull()?.jsonObject?.let {
        FeatGrant(
            name = it.str("name"),
            slug = it.str("name").slugify(),
            level = it.intOr("level", 1),
        )
    }
    return Background(
        slug = slug,
        name = root.str("name"),
        boosts = sys.boosts("boosts"),
        trainedSkills = ts?.get("value")?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList(),
        trainedLore = ts?.get("lore")?.jsonArray?.map { it.jsonPrimitive.content }
            ?: listOfNotNull(sys["trainedLore"]?.jsonPrimitive?.content?.takeIf { it.isNotBlank() }),
        grantedFeat = granted,
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformClass(slug: String, root: JsonObject): PCClass {
    val sys = root.sys()
    val atk = sys.obj("attacks")
    val def = sys.obj("defenses")
    val saves = sys.obj("savingThrows")
    val ts = sys.obj("trainedSkills")
    val otherAtk = atk["other"]?.jsonObject?.takeIf { it.intOr("rank", 0) > 0 }?.let {
        OtherProficiency(it.str("name"), it.int("rank"))
    }

    val features = sys["items"]?.jsonObject?.values?.map { entry ->
        val e = entry.jsonObject
        // items[].name is a display label; the uuid tail is the actual feature name
        // (e.g. name="Deity" but uuid="...Item.Deity (Cleric)" → slug=deity-cleric)
        val uuidName = e.str("uuid").substringAfter(".Item.")
        ClassFeatureGrant(
            name = e.str("name"),
            slug = uuidName.slugify(),
            level = e.intOr("level", 1),
        )
    }?.sortedBy { it.level } ?: emptyList()

    return PCClass(
        slug = slug,
        name = root.str("name"),
        hp = sys.int("hp"),
        keyAbility = sys.obj("keyAbility").arr("value").map { Ability.fromSlug(it.jsonPrimitive.content) },
        perception = sys.int("perception"),
        savingThrows = SavingThrows(saves.int("fortitude"), saves.int("reflex"), saves.int("will")),
        attacks = AttackProficiencies(
            unarmed = atk.int("unarmed"), simple = atk.int("simple"),
            martial = atk.int("martial"), advanced = atk.int("advanced"),
            other = otherAtk,
        ),
        defenses = DefenseProficiencies(
            unarmored = def.int("unarmored"), light = def.int("light"),
            medium = def.int("medium"), heavy = def.int("heavy"),
        ),
        classDC = sys.intOr("classDC", 1),
        spellcasting = sys.intOr("spellcasting", 0),
        trainedSkills = ts.arr("value").map { it.jsonPrimitive.content },
        additionalSkills = ts.intOr("additional", 0),
        ancestryFeatLevels = sys.levelList("ancestryFeatLevels"),
        classFeatLevels = sys.levelList("classFeatLevels"),
        generalFeatLevels = sys.levelList("generalFeatLevels"),
        skillFeatLevels = sys.levelList("skillFeatLevels"),
        skillIncreaseLevels = sys.levelList("skillIncreaseLevels"),
        classFeatures = features,
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformClassFeature(slug: String, root: JsonObject): ClassFeature {
    val sys = root.sys()
    return ClassFeature(
        slug = slug,
        name = root.str("name"),
        level = sys["level"]?.jsonObject?.intOr("value", 0) ?: 0,
        category = sys.strOr("category", "classfeature"),
        actionType = sys["actionType"]?.jsonObject?.get("value")?.jsonPrimitive?.content?.takeIf { it.isNotBlank() },
        actions = sys["actions"]?.jsonObject?.get("value")?.jsonPrimitive?.intOrNull,
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformFeat(slug: String, root: JsonObject): Feat {
    val sys = root.sys()
    val prereqs = sys["prerequisites"]?.jsonObject?.get("value")?.jsonArray
        ?.mapNotNull { it.jsonObject["value"]?.jsonPrimitive?.content }
        ?.map { recordPrereq(PrereqParser.parse(it)) }
        ?: emptyList()

    return Feat(
        slug = slug,
        name = root.str("name"),
        level = sys["level"]?.jsonObject?.intOr("value", 1) ?: 1,
        category = sys.strOr("category", "general"),
        prerequisites = prereqs,
        actionType = sys["actionType"]?.jsonObject?.get("value")?.jsonPrimitive?.content?.takeIf { it.isNotBlank() },
        actions = sys["actions"]?.jsonObject?.get("value")?.jsonPrimitive?.intOrNull,
        maxTakeable = sys["maxTakeable"]?.jsonPrimitive?.intOrNull?.takeIf { it > 1 },
        traits = sys.traits(),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

private fun transformSpell(slug: String, root: JsonObject): Spell {
    val sys = root.sys()
    val t = sys.obj("traits")
    val dmg = sys["damage"]?.jsonObject?.values?.map { d ->
        val o = d.jsonObject
        SpellDamage(
            formula = o.strOr("formula", ""),
            type = o.strOr("type", ""),
            category = o["category"]?.let { if (it is JsonNull) null else it.jsonPrimitive.content },
        )
    } ?: emptyList()
    val def = sys["defense"]?.takeIf { it !is JsonNull }?.jsonObject?.get("save")
        ?.takeIf { it !is JsonNull }?.jsonObject?.let {
            SpellDefense(it.str("statistic"), it["basic"]?.jsonPrimitive?.booleanOrNull ?: false)
        }

    return Spell(
        slug = slug,
        name = root.str("name"),
        level = sys["level"]?.jsonObject?.intOr("value", 1) ?: 1,
        traditions = t.arr("traditions").map { it.jsonPrimitive.content },
        time = sys["time"]?.jsonObject?.strOr("value", "") ?: "",
        range = sys["range"]?.jsonObject?.strOr("value", "") ?: "",
        area = sys["area"]?.takeIf { it !is JsonNull }?.jsonObject?.let {
            SpellArea(it.str("type"), it.int("value"))
        },
        targets = sys["target"]?.jsonObject?.strOr("value", "") ?: "",
        duration = sys["duration"]?.jsonObject?.strOr("value", "") ?: "",
        defense = def,
        damage = dmg,
        heightening = sys["heightening"] as? JsonObject,
        traits = Traits(t.strOr("rarity", "common"), t.arr("value").map { it.jsonPrimitive.content }),
        rules = sys.rules(),
        description = sys.description(),
        publication = sys.publication(),
    )
}

// ============================================================================
// JSON helpers
// ============================================================================

private fun JsonObject.sys(): JsonObject = this["system"]?.jsonObject ?: error("missing system")
private fun JsonObject.pubTitle(): String? =
    this["system"]?.jsonObject?.get("publication")?.jsonObject?.get("title")?.jsonPrimitive?.content

private fun JsonObject.str(key: String): String = this[key]?.jsonPrimitive?.content ?: error("missing $key")
private fun JsonObject.strOr(key: String, default: String): String = this[key]?.jsonPrimitive?.content ?: default
private fun JsonObject.int(key: String): Int = this[key]?.jsonPrimitive?.int ?: error("missing $key")
private fun JsonObject.intOr(key: String, default: Int): Int = this[key]?.jsonPrimitive?.intOrNull ?: default
private fun JsonObject.obj(key: String): JsonObject = this[key]?.jsonObject ?: JsonObject(emptyMap())
private fun JsonObject.arr(key: String): JsonArray = this[key]?.jsonArray ?: JsonArray(emptyList())

private fun JsonObject.traits(): Traits {
    val t = obj("traits")
    return Traits(t.strOr("rarity", "common"), t.arr("value").map { it.jsonPrimitive.content })
}

private fun JsonObject.rules(): List<RuleElement> =
    arr("rules").map { jsonIn.decodeFromJsonElement(RuleElementSerializer, it) }

private fun JsonObject.publication(): Publication {
    val p = obj("publication")
    return Publication(p.strOr("license", ""), p["remaster"]?.jsonPrimitive?.booleanOrNull ?: false, p.strOr("title", ""))
}

/** Foundry boosts: {"0":{"value":["str","dex"]}, "1":{"value":[...]}} — numbered slots */
private fun JsonObject.boosts(key: String): List<List<Ability>> {
    val slots = obj(key)
    return slots.entries.sortedBy { it.key.toIntOrNull() ?: 0 }.map { (_, v) ->
        v.jsonObject.arr("value").map { Ability.fromSlug(it.jsonPrimitive.content) }
    }
}

private fun JsonObject.levelList(key: String): List<Int> =
    obj(key).arr("value").map { it.jsonPrimitive.int }

private fun JsonObject.description(): String =
    obj("description").strOr("value", "").stripHtml()

// ============================================================================
// Text cleanup
// ============================================================================

private val htmlTagRx = Regex("<[^>]+>")
private val uuidRefRx = Regex("""@UUID\[[^]]+]\{([^}]+)}""")
private val uuidBareRx = Regex("""@UUID\[[^]]+]""")
private val whitespaceRx = Regex("""\s+""")

private fun String.stripHtml(): String =
    this.replace(uuidRefRx) { it.groupValues[1] }
        .replace(uuidBareRx, "")
        .replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
        .replace("</p>", "\n").replace("<hr />", "\n")
        .replace(htmlTagRx, "")
        .replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        .lines().joinToString("\n") { it.replace(whitespaceRx, " ").trim() }
        .replace(Regex("\n{3,}"), "\n\n")
        .trim()

/** Matches Foundry's filename convention: drop apostrophes, then kebab-case. */
private fun String.slugify(): String =
    lowercase().replace("'", "").replace(Regex("[^a-z0-9]+"), "-").trim('-')

// ============================================================================
// Prerequisite stats tracking
// ============================================================================

private var prereqTotal = 0
private val prereqByType = mutableMapOf<String, Int>()

private fun recordPrereq(p: Predicate): Predicate {
    prereqTotal++
    val type = when (p) {
        is Predicate.SkillRank -> "skill"
        is Predicate.AbilityMod -> "ability"
        is Predicate.HasFeat -> "feat"
        is Predicate.HasFeature -> "feature"
        is Predicate.Or -> "or"
        is Predicate.And -> "and"
        is Predicate.Manual -> "manual"
    }
    prereqByType[type] = (prereqByType[type] ?: 0) + 1
    return p
}

private fun reportPrereqStats() {
    if (prereqTotal == 0) return
    println("Prerequisites parsed: $prereqTotal")
    prereqByType.entries.sortedByDescending { it.value }.forEach { (k, v) ->
        println("  %-10s %4d (%2d%%)".format("$k:", v, v * 100 / prereqTotal))
    }
    val manual = prereqByType["manual"] ?: 0
    println("  structured: ${(prereqTotal - manual) * 100 / prereqTotal}%")
}
