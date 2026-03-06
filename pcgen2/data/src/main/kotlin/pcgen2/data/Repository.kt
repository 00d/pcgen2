package pcgen2.data

import kotlinx.serialization.json.Json

/**
 * Loads all Player Core game data from classpath resources.
 * Each pack has an `_index.txt` listing one slug per line.
 */
object Repository {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = false
    }

    private const val ROOT = "/pcgen2/packs"

    val ancestries: Map<String, Ancestry> by lazy { load("ancestries", Ancestry.serializer()) }
    val heritages: Map<String, Heritage> by lazy { load("heritages", Heritage.serializer()) }
    val backgrounds: Map<String, Background> by lazy { load("backgrounds", Background.serializer()) }
    val classes: Map<String, PCClass> by lazy { load("classes", PCClass.serializer()) }
    val classFeatures: Map<String, ClassFeature> by lazy { load("classfeatures", ClassFeature.serializer()) }
    val feats: Map<String, Feat> by lazy { load("feats", Feat.serializer()) }
    val spells: Map<String, Spell> by lazy { load("spells", Spell.serializer()) }

    /** Name → slug index across feats + class features, for prerequisite resolution. */
    val nameIndex: Map<String, GameItem> by lazy {
        buildMap {
            feats.values.forEach { put(it.name.lowercase(), it) }
            classFeatures.values.forEach { put(it.name.lowercase(), it) }
        }
    }

    fun heritagesFor(ancestrySlug: String): List<Heritage> =
        heritages.values.filter { it.ancestrySlug == null || it.ancestrySlug == ancestrySlug }

    fun featsWithTrait(trait: String): List<Feat> =
        feats.values.filter { trait in it.traits.value }

    /**
     * Resolves a Foundry Compendium UUID to a loaded item.
     * Format: `Compendium.pf2e.{pack}.Item.{Name}`
     * Returns null if not found (item may be from a pack we don't ship, e.g. actionspf2e).
     */
    fun resolveUuid(uuid: String): GameItem? {
        // Name is everything after ".Item." — names may contain dots so don't use substringAfterLast(".")
        val name = uuid.substringAfter(".Item.", uuid)
        return nameIndex[name.lowercase()]
    }

    private fun <T : GameItem> load(pack: String, serializer: kotlinx.serialization.KSerializer<T>): Map<String, T> {
        val indexStream = javaClass.getResourceAsStream("$ROOT/$pack/_index.txt")
            ?: error("missing pack index: $pack")
        return indexStream.bufferedReader().useLines { lines ->
            lines.filter { it.isNotBlank() }.associate { slug ->
                val itemStream = javaClass.getResourceAsStream("$ROOT/$pack/$slug.json")
                    ?: error("missing item: $pack/$slug")
                val item = json.decodeFromString(serializer, itemStream.bufferedReader().readText())
                slug to item
            }
        }
    }
}
