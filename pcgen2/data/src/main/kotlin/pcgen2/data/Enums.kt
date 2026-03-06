package pcgen2.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class Ability(val slug: String) {
    @SerialName("str") STR("str"),
    @SerialName("dex") DEX("dex"),
    @SerialName("con") CON("con"),
    @SerialName("int") INT("int"),
    @SerialName("wis") WIS("wis"),
    @SerialName("cha") CHA("cha");

    companion object {
        private val bySlug = entries.associateBy { it.slug }
        fun fromSlug(slug: String): Ability = bySlug[slug] ?: error("unknown ability: $slug")
    }
}

@Serializable
enum class Rank(val value: Int) {
    @SerialName("0") UNTRAINED(0),
    @SerialName("1") TRAINED(1),
    @SerialName("2") EXPERT(2),
    @SerialName("3") MASTER(3),
    @SerialName("4") LEGENDARY(4);

    companion object {
        fun fromValue(v: Int): Rank = entries.first { it.value == v }
    }
}

/** PF2 core skills (17). Lore skills are open-ended strings, tracked separately. */
@Serializable
enum class Skill(val slug: String, val ability: Ability) {
    ACROBATICS("acrobatics", Ability.DEX),
    ARCANA("arcana", Ability.INT),
    ATHLETICS("athletics", Ability.STR),
    CRAFTING("crafting", Ability.INT),
    DECEPTION("deception", Ability.CHA),
    DIPLOMACY("diplomacy", Ability.CHA),
    INTIMIDATION("intimidation", Ability.CHA),
    MEDICINE("medicine", Ability.WIS),
    NATURE("nature", Ability.WIS),
    OCCULTISM("occultism", Ability.INT),
    PERFORMANCE("performance", Ability.CHA),
    RELIGION("religion", Ability.WIS),
    SOCIETY("society", Ability.INT),
    STEALTH("stealth", Ability.DEX),
    SURVIVAL("survival", Ability.WIS),
    THIEVERY("thievery", Ability.DEX),
    /** Not a real skill but used in some Foundry data for conditional ranks. */
    COMPUTERS("computers", Ability.INT);

    companion object {
        private val bySlug = entries.associateBy { it.slug }
        fun fromSlug(slug: String): Skill? = bySlug[slug]
    }
}

@Serializable
enum class Save(val slug: String) {
    @SerialName("fortitude") FORTITUDE("fortitude"),
    @SerialName("reflex") REFLEX("reflex"),
    @SerialName("will") WILL("will");
}

@Serializable
enum class WeaponCategory(val slug: String) {
    UNARMED("unarmed"), SIMPLE("simple"), MARTIAL("martial"), ADVANCED("advanced");
}

@Serializable
enum class ArmorCategory(val slug: String) {
    UNARMORED("unarmored"), LIGHT("light"), MEDIUM("medium"), HEAVY("heavy");
}

@Serializable
enum class FeatCategory(val slug: String, val display: String) {
    ANCESTRY("ancestry", "Ancestry Feat"),
    CLASS("class", "Class Feat"),
    GENERAL("general", "General Feat"),
    SKILL("skill", "Skill Feat"),
    ARCHETYPE("archetype", "Archetype Feat"),
    BONUS("bonus", "Bonus Feat");

    companion object {
        private val bySlug = entries.associateBy { it.slug }
        fun fromSlug(slug: String): FeatCategory? = bySlug[slug]
    }
}

@Serializable
enum class Size(val slug: String) {
    @SerialName("tiny") TINY("tiny"),
    @SerialName("sm") SMALL("sm"),
    @SerialName("med") MEDIUM("med"),
    @SerialName("lg") LARGE("lg"),
    @SerialName("huge") HUGE("huge"),
    @SerialName("grg") GARGANTUAN("grg");
}
