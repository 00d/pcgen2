package pcgen2.core

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.add
import kotlinx.serialization.json.addJsonArray
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import pcgen2.data.Ability
import pcgen2.data.Repository
import pcgen2.data.Save
import pcgen2.data.Size
import pcgen2.data.Skill

/**
 * Emits Pathbuilder 2e JSON from a build record + derived state.
 *
 * Format reverse-engineered from Pathbuilder's `json.php` endpoint and the
 * canonical consumer, MrPrimate/pathmuncher (Foundry importer). Wire-level
 * quirks preserved:
 *
 *   - Proficiencies stored as `rank × 2` (pathmuncher does `/ 2` on read)
 *   - Abilities as legacy scores; pathmuncher recovers mod via `⌊(score−10)/2⌋`,
 *     so `10 + mod × 2` round-trips cleanly for all values we produce
 *   - Ability breakdown strings capitalized ("Str"); consumer lowercases
 *   - `size` is an int (0=tiny … 2=med … 5=grg); matches [Size.ordinal]
 *   - `alignment` field required by consumers though Remaster removed it
 *   - Feats are positional tuples, not objects — minimum 4 elements
 *
 * Not a general serializer. Fields we can't derive meaningfully from a v1
 * build record (equipment, spells, money, pets) are emitted as empty
 * containers so consumers don't KeyError.
 */
object PathbuilderExport {

    fun export(builder: CharacterBuilder, state: CharacterState = builder.build()): JsonObject =
        buildJsonObject {
            put("success", true)
            putJsonObject("build") { buildBody(builder, state) }
        }

    private fun JsonObjectBuilder.buildBody(b: CharacterBuilder, s: CharacterState) {
        put("name", b.name)
        put("class", b.classItem?.name ?: "")
        put("dualClass", JsonNull)
        put("level", b.level)
        put("ancestry", b.ancestryItem?.name ?: "")
        put("heritage", b.heritageItem?.name ?: "")
        put("background", b.backgroundItem?.name ?: "")
        put("alignment", "N")
        put("gender", "Not set")
        put("age", "Not set")
        put("deity", "Not set")
        put("size", (b.ancestryItem?.size ?: Size.MEDIUM).ordinal)
        put("sizeName", (b.ancestryItem?.size ?: Size.MEDIUM).name.lowercase().replaceFirstChar { it.uppercase() })
        put("keyability", b.keyAbility?.slug ?: "")

        putJsonArray("languages") { s.languages.forEach { add(it.replaceFirstChar(Char::uppercase)) } }

        put("abilities", abilities(b, s))
        put("attributes", attributes(s))
        put("proficiencies", proficiencies(s))
        put("feats", feats(b))
        put("specials", specials(b, s))
        put("lores", lores(s))

        // Empty stubs — v1 doesn't track these but consumers iterate them
        putJsonArray("equipment") {}
        putJsonArray("specificProficiencies") {}
        putJsonArray("weapons") {}
        putJsonArray("armor") {}
        putJsonArray("spellCasters") {}
        putJsonArray("formula") {}
        putJsonArray("pets") {}
        putJsonObject("acTotal") {}
        putJsonObject("money") { put("cp", 0); put("sp", 0); put("gp", 0); put("pp", 0) }
    }

    // ─── Abilities ───────────────────────────────────────────────────────────
    //
    // Pathbuilder predates Remaster so it stores *scores*, not modifiers.
    // score = 10 + mod × 2 inverts pathmuncher's `trunc((score − 10) / 2)`
    // exactly for the range we produce. The `breakdown` is what importers
    // actually trust — scores are a fallback.

    private fun abilities(b: CharacterBuilder, s: CharacterState) = buildJsonObject {
        for (a in Ability.entries) put(a.slug, 10 + s.abilityMod(a) * 2)
        put("breakdown", breakdown(b))
    }

    /**
     * Separates ancestry/background boost picks into fixed vs. free by
     * replaying slot semantics from [CharacterBuilder.applyAbilityBoosts]:
     * single-ability slots are fixed boosts, multi-ability slots consume
     * from the pick list. Boosts are emitted in slot order, not pick order.
     */
    private fun breakdown(b: CharacterBuilder) = buildJsonObject {
        val anc = b.ancestryItem
        val ancFixed = mutableListOf<Ability>()
        val ancFree = mutableListOf<Ability>()
        if (anc != null) {
            var pickIdx = 0
            for (slot in anc.boosts) when (slot.size) {
                0 -> {}
                1 -> ancFixed += slot[0]
                else -> b.ancestryBoosts.getOrNull(pickIdx++)?.let { ancFree += it }
            }
        }
        putAbilities("ancestryFree", ancFree)
        putAbilities("ancestryBoosts", ancFixed)
        putAbilities("ancestryFlaws", anc?.flaws.orEmpty().filter { it.size == 1 }.map { it[0] })

        // Background: both constrained-choice and free slots land in one array.
        // Pathmuncher matches them positionally against Foundry's boost slots.
        val bg = b.backgroundItem
        val bgBoosts = mutableListOf<Ability>()
        if (bg != null) {
            var pickIdx = 0
            for (slot in bg.boosts) when (slot.size) {
                0 -> {}
                1 -> bgBoosts += slot[0]
                else -> b.backgroundBoosts.getOrNull(pickIdx++)?.let { bgBoosts += it }
            }
        }
        putAbilities("backgroundBoosts", bgBoosts)
        putAbilities("classBoosts", listOfNotNull(b.keyAbility))

        putJsonObject("mapLevelledBoosts") {
            for (lvl in CharacterBuilder.BOOST_LEVELS) {
                val picks = b.levelBoosts[lvl] ?: continue
                if (lvl > b.level) continue
                putAbilities(lvl.toString(), picks)
            }
        }
    }

    private fun JsonObjectBuilder.putAbilities(key: String, abilities: List<Ability>) =
        putJsonArray(key) { abilities.forEach { add(it.pb) } }

    /** "str" → "Str" — pathmuncher lowercases on read, but match the wire convention. */
    private val Ability.pb get() = slug.replaceFirstChar(Char::uppercase)

    // ─── Attributes ──────────────────────────────────────────────────────────

    private fun attributes(s: CharacterState) = buildJsonObject {
        put("ancestryhp", s.getInt("system.attributes.ancestryhp"))
        put("classhp", s.getInt("system.attributes.classhp"))
        put("bonushp", s.getInt("system.attributes.bonushp"))
        put("bonushpPerLevel", s.getInt("system.attributes.bonushpPerLevel"))
        put("speed", s.speed)
        put("speedBonus", 0)
    }

    // ─── Proficiencies ───────────────────────────────────────────────────────
    //
    // Everything is rank × 2. pathmuncher only actually reads perception and
    // classDC (and even those are commented out currently), but Pathbuilder
    // itself populates all of these — match the full shape for round-tripping.

    private fun proficiencies(s: CharacterState) = buildJsonObject {
        put("classDC", s.classDC.value * 2)
        put("perception", s.perception.value * 2)
        put("fortitude", s.save(Save.FORTITUDE).value * 2)
        put("reflex", s.save(Save.REFLEX).value * 2)
        put("will", s.save(Save.WILL).value * 2)
        put("heavy", s.getInt("system.proficiencies.defenses.heavy.rank") * 2)
        put("medium", s.getInt("system.proficiencies.defenses.medium.rank") * 2)
        put("light", s.getInt("system.proficiencies.defenses.light.rank") * 2)
        put("unarmored", s.getInt("system.proficiencies.defenses.unarmored.rank") * 2)
        put("advanced", s.getInt("system.proficiencies.attacks.advanced.rank") * 2)
        put("martial", s.getInt("system.proficiencies.attacks.martial.rank") * 2)
        put("simple", s.getInt("system.proficiencies.attacks.simple.rank") * 2)
        put("unarmed", s.getInt("system.proficiencies.attacks.unarmed.rank") * 2)
        put("castingArcane", 0)
        put("castingDivine", 0)
        put("castingOccult", 0)
        put("castingPrimal", 0)
        for (sk in Skill.entries) put(sk.slug, s.skillRank(sk).value * 2)
    }

    // ─── Feats ───────────────────────────────────────────────────────────────
    //
    // Positional tuples: [name, extra, type, level]. A 7-element extended form
    // carries parent/child choice refs; we emit the 4-element minimum — enough
    // for pathmuncher to locate slots via (type, level).
    //
    // Only user-selected picks. Auto-granted feats (background's bonus feat,
    // GrantItem chains) are rediscovered by Foundry's rules engine at import;
    // emitting them here would create duplicates.

    private fun feats(b: CharacterBuilder): JsonArray = buildJsonArray {
        for (pick in b.featPicks) {
            val feat = Repository.feats[pick.featSlug] ?: continue
            addJsonArray {
                add(feat.name)
                add(JsonNull)              // extra — sub-choice like "Assurance (Athletics)"
                add(pick.category.display) // "Ancestry Feat", "Class Feat", ...
                add(pick.level)
            }
        }
    }

    // ─── Specials ────────────────────────────────────────────────────────────
    //
    // Class feature display names + engine-granted feats not in featPicks.
    // Pathmuncher filters heavily against its own ignore-list; over-reporting
    // here is harmless.

    private fun specials(b: CharacterBuilder, s: CharacterState): JsonArray {
        val picked = b.featPicks.mapTo(mutableSetOf()) { it.featSlug }
        return buildJsonArray {
            for (g in s.granted) {
                if (g.kind == "feature") add(g.name)
                else if (g.kind == "feat" && g.slug !in picked) add(g.name)
            }
        }
    }

    private fun lores(s: CharacterState) = buildJsonArray {
        for ((name, rank) in s.lores) addJsonArray { add(name); add(rank.value * 2) }
    }
}
