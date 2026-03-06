package pcgen2.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Feat/feature prerequisite, parsed from Foundry's prose strings at ingest time.
 * Evaluated against CharacterState during build.
 */
@Serializable
sealed interface Predicate {

    /** "trained in Athletics", "master in Stealth" */
    @Serializable
    @SerialName("skill")
    data class SkillRank(val skill: String, val rank: Rank) : Predicate

    /** "Dexterity +2" — minimum ability modifier */
    @Serializable
    @SerialName("ability")
    data class AbilityMod(val ability: Ability, val min: Int) : Predicate

    /** "Power Attack" — must have taken this feat */
    @Serializable
    @SerialName("feat")
    data class HasFeat(val name: String) : Predicate

    /** "arcane bond", "healing font" — must have this class feature */
    @Serializable
    @SerialName("feature")
    data class HasFeature(val name: String) : Predicate

    /** "Aggressive Block or Brutish Shove" */
    @Serializable
    @SerialName("or")
    data class Or(val any: List<Predicate>) : Predicate

    @Serializable
    @SerialName("and")
    data class And(val all: List<Predicate>) : Predicate

    /**
     * ~13% fallback — semantic queries that can't be machine-checked.
     * Engine treats as permissive (true) and UI surfaces the text as a warning.
     * Examples: "at least 100 years old", "Assurance in that skill",
     * "at least one innate spell from a gnome heritage or ancestry feat that shares a tradition..."
     */
    @Serializable
    @SerialName("manual")
    data class Manual(val text: String) : Predicate
}
