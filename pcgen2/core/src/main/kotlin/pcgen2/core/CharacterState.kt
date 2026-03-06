package pcgen2.core

import pcgen2.data.Ability
import pcgen2.data.ArmorCategory
import pcgen2.data.Rank
import pcgen2.data.RuleElement.ActiveEffectLike.Mode
import pcgen2.data.Save
import pcgen2.data.Skill
import pcgen2.data.WeaponCategory

/**
 * Path-based character state. Foundry Rule Elements mutate this directly via
 * path strings like `"system.skills.athletics.rank"` — those paths flow through
 * unchanged from the ingested JSON. Typed accessors wrap the hot paths.
 *
 * Paths are stored flat (dot-segmented keys) rather than as nested maps: simpler
 * mutation semantics for upgrade/add/override modes, trivial snapshotting.
 */
class CharacterState {
    private val data = mutableMapOf<String, Any?>()

    /** Per-item flags — `{item|flags.system.rulesSelections.X}` interpolation source. */
    private val itemFlags = mutableMapOf<String, MutableMap<String, Any?>>()

    /** Lore skills are open-ended strings, stored separately. */
    val lores = mutableMapOf<String, Rank>()

    /** Traits granted by ancestry/heritage/features. */
    val traits = mutableSetOf<String>()

    /**
     * Foundry roll options — string tags like `class:fighter`, `feat:power-attack`,
     * `feature:bravery`, `hold-mark:burning-sun`. Predicates test membership.
     * Populated by [RuleEngine] as items are granted and choices are made.
     */
    val rollOptions = mutableSetOf<String>()

    /** Class features, feats, and other items granted (by engine or builder). */
    val granted = mutableListOf<GrantedItem>()

    /** Weapon-group-specific proficiencies from MartialProficiency rules. */
    val martialProficiencies = mutableListOf<MartialProficiency>()

    val senses = mutableListOf<Sense>()
    val resistances = mutableListOf<Resistance>()
    val languages = mutableSetOf<String>()

    // ------------------------------------------------------------------------
    // Path ops
    // ------------------------------------------------------------------------

    fun get(path: String): Any? = data[path]

    fun getInt(path: String, default: Int = 0): Int = when (val v = data[path]) {
        is Int -> v
        is Number -> v.toInt()
        is String -> v.toIntOrNull() ?: default
        null -> default
        else -> default
    }

    fun set(path: String, value: Any?) {
        data[path] = value
    }

    /** Applies a Foundry ActiveEffectLike mutation. */
    fun mutate(path: String, mode: Mode, value: Any?) {
        when (mode) {
            Mode.upgrade -> {
                val cur = getInt(path, Int.MIN_VALUE)
                val new = asInt(value)
                if (new > cur) data[path] = new
            }
            Mode.add -> when (value) {
                is Int, is Number -> data[path] = getInt(path) + asInt(value)
                else -> {
                    // add-to-list semantics (wildShapeForms etc.)
                    @Suppress("UNCHECKED_CAST")
                    val list = (data[path] as? MutableList<Any?>) ?: mutableListOf<Any?>().also { data[path] = it }
                    list.add(value)
                }
            }
            Mode.override -> data[path] = value
            Mode.downgrade -> {
                val cur = getInt(path, Int.MAX_VALUE)
                val new = asInt(value)
                if (new < cur) data[path] = new
            }
            Mode.subtract -> data[path] = getInt(path) - asInt(value)
        }
    }

    private fun asInt(v: Any?): Int = when (v) {
        is Int -> v
        is Number -> v.toInt()
        is String -> v.toIntOrNull() ?: 0
        else -> 0
    }

    fun itemFlag(itemSlug: String, flag: String): Any? = itemFlags[itemSlug]?.get(flag)

    fun setItemFlag(itemSlug: String, flag: String, value: Any?) {
        itemFlags.getOrPut(itemSlug) { mutableMapOf() }[flag] = value
    }

    /** Snapshot of all path data — used by Pathbuilder export. */
    fun paths(): Map<String, Any?> = data.toMap()

    // ------------------------------------------------------------------------
    // Typed facade
    // ------------------------------------------------------------------------

    var level: Int
        get() = getInt("system.details.level.value", 0)
        set(v) { data["system.details.level.value"] = v }

    fun abilityMod(a: Ability): Int = getInt("system.abilities.${a.slug}.mod")
    fun setAbilityMod(a: Ability, mod: Int) { data["system.abilities.${a.slug}.mod"] = mod }

    fun skillRank(s: Skill): Rank = Rank.fromValue(getInt("system.skills.${s.slug}.rank"))
    fun skillRank(slug: String): Rank = Rank.fromValue(getInt("system.skills.$slug.rank"))

    fun attackProf(c: WeaponCategory): Rank = Rank.fromValue(getInt("system.proficiencies.attacks.${c.slug}.rank"))
    fun defenseProf(c: ArmorCategory): Rank = Rank.fromValue(getInt("system.proficiencies.defenses.${c.slug}.rank"))

    fun save(s: Save): Rank = Rank.fromValue(getInt("system.saves.${s.slug}.rank"))

    val perception: Rank get() = Rank.fromValue(getInt("system.attributes.perception.rank"))
    val classDC: Rank get() = Rank.fromValue(getInt("system.attributes.classDC.rank"))
    val speed: Int get() = getInt("system.attributes.speed.value")

    /** PF2 HP = ancestry HP + level × (class HP + CON mod) + bonus */
    fun hp(): Int {
        val anc = getInt("system.attributes.ancestryhp")
        val cls = getInt("system.attributes.classhp")
        val con = abilityMod(Ability.CON)
        val bonus = getInt("system.attributes.bonushp")
        val bonusPerLevel = getInt("system.attributes.bonushpPerLevel")
        return anc + level * (cls + con) + bonus + level * bonusPerLevel
    }

    /** Identity slugs — set by CharacterBuilder for prereq/trait filtering. */
    var ancestrySlug: String?
        get() = data["system.details.ancestry.slug"] as? String
        set(v) { data["system.details.ancestry.slug"] = v }
    var heritageSlug: String?
        get() = data["system.details.heritage.slug"] as? String
        set(v) { data["system.details.heritage.slug"] = v }
    var backgroundSlug: String?
        get() = data["system.details.background.slug"] as? String
        set(v) { data["system.details.background.slug"] = v }
    var classSlug: String?
        get() = data["system.details.class.slug"] as? String
        set(v) { data["system.details.class.slug"] = v }
}

data class GrantedItem(val slug: String, val name: String, val kind: String, val level: Int, val source: String)
data class MartialProficiency(val definition: List<String>, val rank: Rank, val slug: String?)
data class Sense(val type: String, val acuity: String?, val range: Int?)
data class Resistance(val type: String, val value: Int)
