package pcgen2.core

import pcgen2.data.Ability
import pcgen2.data.Ancestry
import pcgen2.data.Background
import pcgen2.data.Feat
import pcgen2.data.FeatCategory
import pcgen2.data.Heritage
import pcgen2.data.PCClass
import pcgen2.data.Predicate
import pcgen2.data.Rank
import pcgen2.data.Repository
import pcgen2.data.RuleElement.ActiveEffectLike.Mode

/**
 * The build record — holds every decision the user made. [build] derives a fresh
 * [CharacterState] by replaying decisions through the rule engine.
 *
 * Rebuild-from-record (not incremental mutation) because level-gated formulas
 * must re-evaluate. Example: skilled-human's `ternary(gte(@actor.level,5),2,1)`
 * upgrades the chosen skill from Trained→Expert only if level≥5; an incremental
 * model that fired that rule once at L1 would never see the upgrade.
 *
 * This record IS the save file. Pathbuilder export reads it directly.
 */
class CharacterBuilder(private val repo: Repository = Repository) {

    var name: String = "Unnamed"
    var level: Int = 1

    // ABCs — slugs only, resolved against repo at build time
    var ancestry: String? = null
    var heritage: String? = null
    var background: String? = null
    var pcClass: String? = null
    var keyAbility: Ability? = null

    /**
     * Ancestry boost picks. Indexed parallel to `Ancestry.boosts`: for each slot,
     * the chosen ability (if the slot is a free/choice slot). Fixed slots and empty
     * slots ignore the pick. PF2 Remaster: each boost is +1 to the modifier.
     */
    val ancestryBoosts = mutableListOf<Ability>()
    val backgroundBoosts = mutableListOf<Ability>()

    /** Four boosts at each of levels 1/5/10/15/20. No duplicates within a set. */
    val levelBoosts = mutableMapOf<Int, List<Ability>>()

    /** ChoiceSet resolutions: `(itemSlug, flag) → picked value`. */
    val choices = mutableMapOf<Pair<String, String>, String>()

    /** Free trained skills from `PCClass.additionalSkills` (e.g. Fighter gets 3 + INT). */
    val additionalSkills = mutableListOf<String>()

    /** Skill increases at each level in `PCClass.skillIncreaseLevels`. */
    val skillIncreases = mutableMapOf<Int, String>()

    /** Feat selections by slot. [FeatPick.level] + [FeatPick.category] identifies the slot. */
    val featPicks = mutableListOf<FeatPick>()

    /** Diagnostic log from the last `build()`. */
    var buildLog: List<String> = emptyList(); private set

    // ─── Fluent record API ────────────────────────────────────────────────────

    fun choice(itemSlug: String, flag: String, value: String) = apply { choices[itemSlug to flag] = value }
    fun selectFeat(level: Int, category: FeatCategory, featSlug: String) =
        apply { featPicks += FeatPick(level, category, featSlug) }
    fun skillIncrease(level: Int, skill: String) = apply { skillIncreases[level] = skill }
    fun boostsAt(level: Int, vararg abilities: Ability) = apply {
        require(abilities.toSet().size == abilities.size) { "duplicate boost at level $level" }
        levelBoosts[level] = abilities.toList()
    }

    // ─── Build ────────────────────────────────────────────────────────────────

    fun build(): CharacterState {
        val s = CharacterState()
        val engine = RuleEngine({ slug, flag, _ -> choices[slug to flag] }, repo)

        s.level = level

        // Attributes first — HP and some formulas read CON/other mods.
        // PF2 Remaster: modifiers start at +0, each boost is +1, flaws -1.
        applyAbilityBoosts(s)

        // Identity & roll options — predicates check `class:fighter` etc.
        val anc = ancestry?.let { repo.ancestries[it] }
        val her = heritage?.let { repo.heritages[it] }
        val bg  = background?.let { repo.backgrounds[it] }
        val cls = pcClass?.let { repo.classes[it] }

        s.ancestrySlug = anc?.slug; anc?.let { s.rollOptions += "ancestry:${it.slug}" }
        s.heritageSlug = her?.slug; her?.let { s.rollOptions += "heritage:${it.slug}" }
        s.backgroundSlug = bg?.slug
        s.classSlug = cls?.slug; cls?.let { s.rollOptions += "class:${it.slug}" }
        s.rollOptions += "self:level:$level"

        // Ancestry: static data + rules
        anc?.let {
            s.set("system.attributes.ancestryhp", it.hp)
            s.set("system.attributes.speed.value", it.speed)
            s.set("system.traits.size", it.size.slug)
            s.traits += it.traits.value
            s.languages += it.languages
            if (it.vision != "normal") s.senses += Sense(it.vision, null, null)
            engine.applyItem(it, s, "ancestry", level = 1)
        }

        // Heritage: rules only (traits flow through ActorTraits rules)
        her?.let { engine.applyItem(it, s, "heritage", level = 1) }

        // Background: trained skills → grant feat → rules
        bg?.let {
            it.trainedSkills.forEach { sk -> s.mutate("system.skills.$sk.rank", Mode.upgrade, 1) }
            it.trainedLore.forEach { lore -> s.lores[lore] = Rank.TRAINED }
            it.grantedFeat?.let { g ->
                val feat = repo.feats[g.slug]
                if (feat != null) engine.applyItem(feat, s, "background-feat", level = 1)
                else engine.log += "  ? background feat unresolved: ${g.slug}"
            }
            engine.applyItem(it, s, "background", level = 1)
        }

        // Class: proficiencies + trained skills + rules
        cls?.let {
            s.set("system.attributes.classhp", it.hp)
            s.mutate("system.attributes.perception.rank", Mode.upgrade, it.perception)
            s.mutate("system.attributes.classDC.rank", Mode.upgrade, it.classDC)
            s.mutate("system.saves.fortitude.rank", Mode.upgrade, it.savingThrows.fortitude)
            s.mutate("system.saves.reflex.rank", Mode.upgrade, it.savingThrows.reflex)
            s.mutate("system.saves.will.rank", Mode.upgrade, it.savingThrows.will)
            s.mutate("system.proficiencies.attacks.unarmed.rank", Mode.upgrade, it.attacks.unarmed)
            s.mutate("system.proficiencies.attacks.simple.rank", Mode.upgrade, it.attacks.simple)
            s.mutate("system.proficiencies.attacks.martial.rank", Mode.upgrade, it.attacks.martial)
            s.mutate("system.proficiencies.attacks.advanced.rank", Mode.upgrade, it.attacks.advanced)
            s.mutate("system.proficiencies.defenses.unarmored.rank", Mode.upgrade, it.defenses.unarmored)
            s.mutate("system.proficiencies.defenses.light.rank", Mode.upgrade, it.defenses.light)
            s.mutate("system.proficiencies.defenses.medium.rank", Mode.upgrade, it.defenses.medium)
            s.mutate("system.proficiencies.defenses.heavy.rank", Mode.upgrade, it.defenses.heavy)
            if (it.spellcasting > 0) s.mutate("system.proficiencies.spellcasting.rank", Mode.upgrade, it.spellcasting)
            it.trainedSkills.forEach { sk -> s.mutate("system.skills.$sk.rank", Mode.upgrade, 1) }
            additionalSkills.forEach { sk -> s.mutate("system.skills.$sk.rank", Mode.upgrade, 1) }
            engine.applyItem(it, s, "class", level = 1)
        }

        // Per-level progression: class features auto-granted, then chosen feats.
        // Features first — they set up roll options that feat predicates may check.
        cls?.let {
            for (lvl in 1..level) {
                it.classFeatures.filter { f -> f.level == lvl }.forEach { grant ->
                    val feature = repo.classFeatures[grant.slug]
                    if (feature != null) engine.applyItem(feature, s, "class@$lvl", level = lvl)
                    else engine.log += "  ? class feature unresolved: ${grant.slug}"
                }
                featPicks.filter { p -> p.level == lvl }.forEach { pick ->
                    val feat = repo.feats[pick.featSlug]
                    if (feat != null) engine.applyItem(feat, s, "${pick.category.slug}@$lvl", level = lvl)
                    else engine.log += "  ? feat pick unresolved: ${pick.featSlug}"
                }
            }
        }

        // Skill increases. PF2 caps: Expert@L3+, Master@L7+, Legendary@L15+.
        // Apply in level order so the cap check sees the right level context.
        for ((lvl, skill) in skillIncreases.toSortedMap()) {
            val current = s.skillRank(skill).value
            val cap = when { lvl >= 15 -> 4; lvl >= 7 -> 3; lvl >= 3 -> 2; else -> 1 }
            val target = (current + 1).coerceAtMost(cap)
            if (target > current) s.mutate("system.skills.$skill.rank", Mode.upgrade, target)
            else engine.log += "  ! skill increase wasted at L$lvl: $skill already at cap $cap"
        }

        buildLog = engine.log.toList()
        return s
    }

    // ─── Attribute computation ────────────────────────────────────────────────
    //
    // PF2 Remastered: modifiers (not scores). Start +0. Each boost +1, flaw -1.
    // No partial boosts. Within-set duplicates prevented by [boostsAt]'s require().

    private fun applyAbilityBoosts(s: CharacterState) {
        val mods = Ability.entries.associateWithTo(mutableMapOf()) { 0 }

        // Ancestry: fixed slots apply their single ability; free/choice slots use picks.
        repo.ancestries[ancestry]?.let { anc ->
            var pickIdx = 0
            for (slot in anc.boosts) when (slot.size) {
                0 -> {} // empty slot
                1 -> mods[slot[0]] = mods[slot[0]]!! + 1  // fixed
                else -> ancestryBoosts.getOrNull(pickIdx++)?.let { mods[it] = mods[it]!! + 1 }
            }
            for (slot in anc.flaws) if (slot.size == 1) mods[slot[0]] = mods[slot[0]]!! - 1
        }

        // Background: same slot semantics
        repo.backgrounds[background]?.let { bg ->
            var pickIdx = 0
            for (slot in bg.boosts) when (slot.size) {
                0 -> {}
                1 -> mods[slot[0]] = mods[slot[0]]!! + 1
                else -> backgroundBoosts.getOrNull(pickIdx++)?.let { mods[it] = mods[it]!! + 1 }
            }
        }

        // Class key ability
        keyAbility?.let { mods[it] = mods[it]!! + 1 }

        // Leveled boosts: 4 at each of 1/5/10/15/20 (only those ≤ current level apply)
        for (boostLvl in BOOST_LEVELS) {
            if (boostLvl > level) break
            levelBoosts[boostLvl]?.forEach { mods[it] = mods[it]!! + 1 }
        }

        for ((a, mod) in mods) s.setAbilityMod(a, mod)
    }

    // ─── Prerequisite evaluation (advisory — build() doesn't enforce) ────────

    /** Checks a feat's parsed prerequisites against a built state. `Manual` always passes. */
    fun checkPrerequisites(feat: Feat, state: CharacterState): Boolean =
        feat.prerequisites.all { evalPrereq(it, state) }

    private fun evalPrereq(p: Predicate, s: CharacterState): Boolean = when (p) {
        is Predicate.SkillRank -> s.skillRank(p.skill).value >= p.rank.value
        is Predicate.AbilityMod -> s.abilityMod(p.ability) >= p.min
        is Predicate.HasFeat -> s.granted.any { it.kind == "feat" && it.name.equals(p.name, ignoreCase = true) }
        is Predicate.HasFeature -> s.granted.any { it.kind == "feature" && it.name.equals(p.name, ignoreCase = true) }
        is Predicate.Or -> p.any.any { evalPrereq(it, s) }
        is Predicate.And -> p.all.all { evalPrereq(it, s) }
        is Predicate.Manual -> true  // UI surfaces the text; engine is permissive
    }

    /** Lists feats eligible for a slot. For UI — build() doesn't call this. */
    fun eligibleFeats(slotLevel: Int, category: FeatCategory, state: CharacterState): List<Feat> {
        val cls = pcClass?.let { repo.classes[it] }
        val anc = ancestry?.let { repo.ancestries[it] }
        return repo.feats.values.filter { feat ->
            feat.level <= slotLevel &&
            feat.category == category.slug &&
            when (category) {
                FeatCategory.CLASS -> cls != null && cls.classTrait in feat.traits.value
                FeatCategory.ANCESTRY -> anc != null && anc.traits.value.any { it in feat.traits.value }
                else -> true
            } &&
            checkPrerequisites(feat, state)
        }
    }

    /** Open feat slots at the current level per class schedule. */
    fun openFeatSlots(): List<FeatSlot> {
        val cls = pcClass?.let { repo.classes[it] } ?: return emptyList()
        val filled = featPicks.groupBy { it.level to it.category }
        return buildList {
            for (lvl in 1..level) {
                if (lvl in cls.ancestryFeatLevels) slot(lvl, FeatCategory.ANCESTRY, filled)
                if (lvl in cls.classFeatLevels) slot(lvl, FeatCategory.CLASS, filled)
                if (lvl in cls.generalFeatLevels) slot(lvl, FeatCategory.GENERAL, filled)
                if (lvl in cls.skillFeatLevels) slot(lvl, FeatCategory.SKILL, filled)
            }
        }
    }

    private fun MutableList<FeatSlot>.slot(lvl: Int, cat: FeatCategory, filled: Map<Pair<Int, FeatCategory>, List<FeatPick>>) {
        add(FeatSlot(lvl, cat, filled[lvl to cat]?.firstOrNull()?.featSlug))
    }

    companion object {
        val BOOST_LEVELS = listOf(1, 5, 10, 15, 20)
    }
}

data class FeatPick(val level: Int, val category: FeatCategory, val featSlug: String)
data class FeatSlot(val level: Int, val category: FeatCategory, val filled: String?)

// ─── Convenience extensions ──────────────────────────────────────────────────

/** Resolved ancestry for a builder — null if unset/invalid. */
val CharacterBuilder.ancestryItem: Ancestry? get() = ancestry?.let { Repository.ancestries[it] }
val CharacterBuilder.heritageItem: Heritage? get() = heritage?.let { Repository.heritages[it] }
val CharacterBuilder.backgroundItem: Background? get() = background?.let { Repository.backgrounds[it] }
val CharacterBuilder.classItem: PCClass? get() = pcClass?.let { Repository.classes[it] }
