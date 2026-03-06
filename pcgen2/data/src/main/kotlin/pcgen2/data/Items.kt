package pcgen2.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

// ============================================================================
// Shared fragments
// ============================================================================

@Serializable
data class Publication(
    val license: String,
    val remaster: Boolean,
    val title: String,
)

@Serializable
data class Traits(
    val rarity: String = "common",
    val value: List<String> = emptyList(),
)

/**
 * Foundry stores boosts as numbered slots `{"0": {value: [...]}, "1": {...}}`.
 * We normalize to a list at ingest. Semantics per slot:
 *  - empty → no boost in this slot
 *  - 1 ability → fixed boost
 *  - 2-5 abilities → choose one of these
 *  - 6 abilities → free boost (any)
 */
typealias Boost = List<Ability>

/** Common interface for GrantItem/Compendium UUID resolution. */
sealed interface GameItem {
    val slug: String
    val name: String
    val rules: List<RuleElement>
    val traits: Traits
}

// ============================================================================
// ABC — Ancestry, Background, Class
// ============================================================================

@Serializable
data class Ancestry(
    override val slug: String,
    override val name: String,
    val hp: Int,
    val speed: Int,
    val size: Size,
    val vision: String,
    val boosts: List<Boost>,
    val flaws: List<Boost>,
    val languages: List<String>,
    val additionalLanguages: Int,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

/** [ancestrySlug] null ⇒ versatile heritage (works with any ancestry). */
@Serializable
data class Heritage(
    override val slug: String,
    override val name: String,
    val ancestrySlug: String?,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

@Serializable
data class Background(
    override val slug: String,
    override val name: String,
    val boosts: List<Boost>,
    val trainedSkills: List<String>,
    val trainedLore: List<String>,
    val grantedFeat: FeatGrant?,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

@Serializable
data class FeatGrant(val name: String, val slug: String, val level: Int)

@Serializable
data class PCClass(
    override val slug: String,
    override val name: String,
    val hp: Int,
    val keyAbility: List<Ability>,
    val perception: Int,
    val savingThrows: SavingThrows,
    val attacks: AttackProficiencies,
    val defenses: DefenseProficiencies,
    val classDC: Int,
    val spellcasting: Int,
    val trainedSkills: List<String>,
    val additionalSkills: Int,
    /** Levels at which each feat slot type opens. */
    val ancestryFeatLevels: List<Int>,
    val classFeatLevels: List<Int>,
    val generalFeatLevels: List<Int>,
    val skillFeatLevels: List<Int>,
    val skillIncreaseLevels: List<Int>,
    /** Class features auto-granted at specific levels. */
    val classFeatures: List<ClassFeatureGrant>,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem {
    /** The trait tag used to filter class feats (e.g. "fighter"). */
    val classTrait: String get() = slug
}

@Serializable
data class SavingThrows(val fortitude: Int, val reflex: Int, val will: Int)

@Serializable
data class AttackProficiencies(
    val unarmed: Int, val simple: Int, val martial: Int, val advanced: Int,
    val other: OtherProficiency? = null,
)

@Serializable
data class DefenseProficiencies(
    val unarmored: Int, val light: Int, val medium: Int, val heavy: Int,
)

@Serializable
data class OtherProficiency(val name: String, val rank: Int)

@Serializable
data class ClassFeatureGrant(val name: String, val slug: String, val level: Int)

// ============================================================================
// Features & Feats
// ============================================================================

@Serializable
data class ClassFeature(
    override val slug: String,
    override val name: String,
    val level: Int,
    val category: String,
    val actionType: String?,
    val actions: Int?,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

@Serializable
data class Feat(
    override val slug: String,
    override val name: String,
    val level: Int,
    val category: String,
    val prerequisites: List<Predicate>,
    val actionType: String?,
    val actions: Int?,
    val maxTakeable: Int?,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

// ============================================================================
// Spells — not build-critical for v1 but loaded for repository completeness
// ============================================================================

@Serializable
data class Spell(
    override val slug: String,
    override val name: String,
    val level: Int,
    val traditions: List<String>,
    val time: String,
    val range: String,
    val area: SpellArea?,
    val targets: String,
    val duration: String,
    val defense: SpellDefense?,
    val damage: List<SpellDamage>,
    val heightening: JsonObject?,
    override val traits: Traits,
    override val rules: List<RuleElement>,
    val description: String,
    val publication: Publication,
) : GameItem

@Serializable
data class SpellArea(val type: String, val value: Int)

@Serializable
data class SpellDefense(val statistic: String, val basic: Boolean)

@Serializable
data class SpellDamage(val formula: String, val type: String, val category: String?)
