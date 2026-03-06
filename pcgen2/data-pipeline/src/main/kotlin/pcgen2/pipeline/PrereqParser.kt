package pcgen2.pipeline

import pcgen2.data.Ability
import pcgen2.data.Predicate
import pcgen2.data.Rank

/**
 * Parses Foundry's prose prerequisite strings into structured [Predicate]s.
 *
 * Corpus: 495 unique strings in Player Core. Target ≥87% structured parse rate.
 * Patterns observed:
 *  - skill rank (160): "trained in Athletics", "master in Stealth"
 *  - ability score (15): "Dexterity +2"
 *  - name reference (~280): "Animal Companion", "Untamed Form" (feat or feature)
 *  - simple OR (~20): "Aggressive Block or Brutish Shove"
 *  - complex (~30): "at least 100 years old", "Assurance in that skill" → Manual
 */
object PrereqParser {

    private val skillRankRx = Regex(
        """^(trained|expert|master|legendary) in ([\w\s]+?)$""",
        RegexOption.IGNORE_CASE
    )

    private val abilityRx = Regex(
        """^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) \+(\d+)$"""
    )

    private val abilityMap = mapOf(
        "Strength" to Ability.STR, "Dexterity" to Ability.DEX, "Constitution" to Ability.CON,
        "Intelligence" to Ability.INT, "Wisdom" to Ability.WIS, "Charisma" to Ability.CHA,
    )

    private val rankMap = mapOf(
        "trained" to Rank.TRAINED, "expert" to Rank.EXPERT,
        "master" to Rank.MASTER, "legendary" to Rank.LEGENDARY,
    )

    /** Simple A-or-B detector. Bails to Manual for complex compounds. */
    private val simpleOrRx = Regex("""^(.+?) or (.+?)$""")

    /** Known class-feature names (lowercase). Distinguishes HasFeature from HasFeat. */
    private var featureNames: Set<String> = emptySet()
    private var featNames: Set<String> = emptySet()

    fun configure(featureNames: Set<String>, featNames: Set<String>) {
        this.featureNames = featureNames.map { it.lowercase() }.toSet()
        this.featNames = featNames.map { it.lowercase() }.toSet()
    }

    fun parse(raw: String): Predicate {
        val text = raw.trim()

        // Skill rank
        skillRankRx.matchEntire(text)?.let { m ->
            val rank = rankMap[m.groupValues[1].lowercase()]!!
            val skill = m.groupValues[2].trim().lowercase().replace(" ", "-")
            return Predicate.SkillRank(skill, rank)
        }

        // Ability modifier
        abilityRx.matchEntire(text)?.let { m ->
            val ability = abilityMap[m.groupValues[1]]!!
            return Predicate.AbilityMod(ability, m.groupValues[2].toInt())
        }

        // Compound OR — only handle simple two-branch with no commas/no "at least"
        if (" or " in text && "," !in text && !text.startsWith("at least") && !text.startsWith("an ") && !text.startsWith("a ")) {
            simpleOrRx.matchEntire(text)?.let { m ->
                val left = parseNameRef(m.groupValues[1].trim())
                val right = parseNameRef(m.groupValues[2].trim())
                if (left !is Predicate.Manual && right !is Predicate.Manual) {
                    return Predicate.Or(listOf(left, right))
                }
            }
        }

        // Comma-separated multi-OR: "trained in Arcana, Nature, Occultism, or Religion"
        if ("," in text && " or " in text) {
            val multiSkill = parseMultiSkillOr(text)
            if (multiSkill != null) return multiSkill
        }

        // Name reference
        return parseNameRef(text)
    }

    private fun parseNameRef(text: String): Predicate {
        val lower = text.lowercase()

        // Bail on obvious prose
        if (lower.startsWith("at least") || lower.startsWith("any ") || lower.startsWith("one or more") ||
            " that " in lower || " which " in lower || lower.endsWith(" old") ||
            lower.startsWith("a ") && lower.split(" ").size > 3
        ) {
            return Predicate.Manual(text)
        }

        return when {
            lower in featureNames -> Predicate.HasFeature(text)
            lower in featNames -> Predicate.HasFeat(text)
            // Heuristic: lowercase-start = feature slug ("arcane bond", "healing font"),
            // uppercase-start = feat name ("Power Attack")
            text[0].isLowerCase() -> Predicate.HasFeature(text)
            else -> Predicate.HasFeat(text)
        }
    }

    /** "trained in Arcana, Nature, Occultism, or Religion" → Or(SkillRank × 4) */
    private fun parseMultiSkillOr(text: String): Predicate? {
        val rankPrefix = Regex("""^(trained|expert|master|legendary) in """, RegexOption.IGNORE_CASE)
        val m = rankPrefix.find(text) ?: return null
        val rank = rankMap[m.groupValues[1].lowercase()]!!
        val rest = text.removePrefix(m.value)
        // Split on ", " and " or " (handling Oxford comma)
        val parts = rest.replace(", or ", ", ").replace(" or ", ", ").split(", ").map { it.trim() }
        if (parts.size < 2 || parts.any { it.contains(" ") && !it.endsWith("Lore") }) return null
        return Predicate.Or(parts.map { Predicate.SkillRank(it.lowercase(), rank) })
    }
}
