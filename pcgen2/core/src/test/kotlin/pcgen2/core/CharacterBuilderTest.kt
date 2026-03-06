package pcgen2.core

import pcgen2.data.Ability.CHA
import pcgen2.data.Ability.CON
import pcgen2.data.Ability.DEX
import pcgen2.data.Ability.INT
import pcgen2.data.Ability.STR
import pcgen2.data.Ability.WIS
import pcgen2.data.ArmorCategory
import pcgen2.data.FeatCategory
import pcgen2.data.Rank
import pcgen2.data.Repository
import pcgen2.data.Save
import pcgen2.data.Skill
import pcgen2.data.WeaponCategory
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class CharacterBuilderTest {

    /**
     * The acceptance test: build a complete Human Fighter 5 and verify every
     * derived stat by hand calculation.
     *
     * Attribute modifier math (PF2 Remaster: start +0, each boost +1):
     *   STR: anc(+1) bg(+1) class(+1) L1(+1)         = +4
     *   DEX:                          L1(+1) L5(+1)   = +2
     *   CON: anc(+1)        L1(+1)           L5(+1)   = +3
     *   INT:                                            = +0
     *   WIS:         bg(+1) L1(+1)           L5(+1)   = +3
     *   CHA:                                 L5(+1)   = +1
     *
     * HP = ancestryHP + level × (classHP + CON)
     *    = 8         + 5     × (10      + 3)   = 73
     */
    @Test fun `Human Fighter 5 — full vertical slice`() {
        val b = CharacterBuilder().apply {
            name = "Valeros"
            level = 5

            ancestry = "human"
            heritage = "versatile-human"
            background = "warrior"
            pcClass = "fighter"
            keyAbility = STR

            // Human has 2 free-boost slots (6 abilities each) + 1 empty slot
            ancestryBoosts += listOf(STR, CON)
            // Warrior: slot 0 = [con, str] choice, slot 1 = free
            backgroundBoosts += listOf(STR, WIS)

            boostsAt(1, STR, DEX, CON, WIS)
            boostsAt(5, DEX, CON, WIS, CHA)

            // ChoiceSets
            choice("fighter", "fighterSkill", "athletics")
            choice("versatile-human", "versatileHeritage", "Compendium.pf2e.feats-srd.Item.Toughness")
            choice("fighter-weapon-mastery", "fighterWeaponMastery", "sword")

            // Fighter gets 3 + INT mod (0) = 3 free skills
            additionalSkills += listOf("survival", "medicine", "society")

            // Feats per slot
            selectFeat(1, FeatCategory.ANCESTRY, "natural-ambition")  // human ancestry feat
            selectFeat(1, FeatCategory.CLASS, "sudden-charge")
            selectFeat(2, FeatCategory.CLASS, "intimidating-strike")
            selectFeat(2, FeatCategory.SKILL, "titan-wrestler")       // athletics skill feat
            selectFeat(3, FeatCategory.GENERAL, "fleet")
            selectFeat(4, FeatCategory.CLASS, "swipe")
            selectFeat(4, FeatCategory.SKILL, "battle-medicine")
            selectFeat(5, FeatCategory.ANCESTRY, "haughty-obstinacy")

            // Natural Ambition grants a bonus class feat via ChoiceSet
            choice("natural-ambition", "naturalAmbition", "Compendium.pf2e.feats-srd.Item.Vicious Swing")

            // Skill increases: L3 and L5
            skillIncrease(3, "athletics")  // trained → expert
            skillIncrease(5, "intimidation")  // trained (from warrior bg) → expert
        }

        val s = b.build()
        val log = b.buildLog.joinToString("\n")

        // ── Attributes ──
        assertEquals(4, s.abilityMod(STR), "STR\n$log")
        assertEquals(2, s.abilityMod(DEX), "DEX")
        assertEquals(3, s.abilityMod(CON), "CON")
        assertEquals(0, s.abilityMod(INT), "INT")
        assertEquals(3, s.abilityMod(WIS), "WIS")
        assertEquals(1, s.abilityMod(CHA), "CHA")

        // ── HP ──
        // 8 (human) + 5 × (10 fighter + 3 CON) = 73
        // Plus Toughness from versatile-human grants +level bonus HP
        // Toughness AEL: path=system.attributes.bonushpPerLevel mode=override value=1? Let's check.
        // Actually Toughness is a FlatModifier (Unhandled) in Foundry — it adds to max HP
        // at gameplay time. So we expect raw 73 here.
        assertEquals(73, s.hp(), "HP = 8 + 5*(10+3)\n$log")

        // ── Proficiencies (from fighter class base) ──
        assertEquals(Rank.EXPERT, s.perception, "fighter starts expert perception")
        assertEquals(Rank.EXPERT, s.save(Save.FORTITUDE))
        assertEquals(Rank.EXPERT, s.save(Save.REFLEX))
        assertEquals(Rank.TRAINED, s.save(Save.WILL))
        assertEquals(Rank.EXPERT, s.attackProf(WeaponCategory.MARTIAL))
        assertEquals(Rank.EXPERT, s.attackProf(WeaponCategory.SIMPLE))
        assertEquals(Rank.TRAINED, s.attackProf(WeaponCategory.ADVANCED))
        assertEquals(Rank.TRAINED, s.defenseProf(ArmorCategory.HEAVY))
        assertEquals(Rank.TRAINED, s.classDC)

        // ── Skills ──
        assertEquals(Rank.EXPERT, s.skillRank(Skill.ATHLETICS),
            "athletics: fighter ChoiceSet trains → L3 increase → expert\n$log")
        assertEquals(Rank.EXPERT, s.skillRank(Skill.INTIMIDATION),
            "intimidation: warrior bg trains → L5 increase → expert")
        assertEquals(Rank.TRAINED, s.skillRank(Skill.SURVIVAL), "free skill pick")
        assertEquals(Rank.TRAINED, s.skillRank(Skill.MEDICINE))
        assertEquals(Rank.TRAINED, s.skillRank(Skill.SOCIETY))
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.ARCANA))

        // ── Lores ──
        assertEquals(Rank.TRAINED, s.lores["Warfare Lore"], "from warrior background")

        // ── Traits & identity ──
        assertTrue("human" in s.traits)
        assertTrue("humanoid" in s.traits)
        assertEquals("human", s.ancestrySlug)
        assertEquals("fighter", s.classSlug)
        assertEquals(25, s.speed)

        // ── Roll options ──
        assertTrue("class:fighter" in s.rollOptions)
        assertTrue("ancestry:human" in s.rollOptions)

        // ── Class features auto-granted ──
        val features = s.granted.filter { it.kind == "feature" }.map { it.name }
        assertTrue("Reactive Strike" in features, "L1 feature\n$features")
        assertTrue("Shield Block" in features, "L1 feature")
        assertTrue("Bravery" in features, "L3 feature")
        assertTrue("Fighter Weapon Mastery" in features, "L5 feature")
        // L7+ features NOT granted
        assertTrue("Battlefield Surveyor" !in features)

        // ── Feats ──
        val feats = s.granted.filter { it.kind == "feat" }.map { it.slug }
        assertTrue("sudden-charge" in feats, feats.toString())
        assertTrue("intimidating-glare" in feats, "granted by warrior background")
        assertTrue("toughness" in feats, "granted by versatile-human ChoiceSet→GrantItem")
        assertTrue("vicious-swing" in feats, "granted by natural-ambition ChoiceSet→GrantItem")

        // ── Fighter Weapon Mastery @L5 — picks weapon group, grants MartialProficiency ──
        val swordMastery = s.martialProficiencies.firstOrNull { "item:group:sword" in it.definition }
        assertNotNull(swordMastery, "expected sword weapon mastery\n$log")
        assertEquals(Rank.MASTER, swordMastery.rank)
    }

    // ─── Rebuild correctness ──────────────────────────────────────────────────

    @Test fun `rebuild-from-record — level-gated formula re-evaluates`() {
        // Skilled Human: rank = ternary(gte(@actor.level,5),2,1)
        val b = CharacterBuilder().apply {
            ancestry = "human"
            heritage = "skilled-human"
            choice("skilled-human", "skill", "stealth")
        }

        b.level = 1
        assertEquals(Rank.TRAINED, b.build().skillRank(Skill.STEALTH))

        b.level = 4
        assertEquals(Rank.TRAINED, b.build().skillRank(Skill.STEALTH))

        b.level = 5
        assertEquals(Rank.EXPERT, b.build().skillRank(Skill.STEALTH), "formula should fire at L5")

        b.level = 20
        assertEquals(Rank.EXPERT, b.build().skillRank(Skill.STEALTH))
    }

    @Test fun `rebuild is idempotent — calling twice yields identical state`() {
        val b = CharacterBuilder().apply {
            level = 3
            ancestry = "dwarf"; heritage = "forge-dwarf"
            background = "acolyte"; pcClass = "fighter"; keyAbility = STR
            choice("fighter", "fighterSkill", "athletics")
        }
        val s1 = b.build()
        val s2 = b.build()
        assertEquals(s1.paths(), s2.paths())
        assertEquals(s1.granted.map { it.slug }, s2.granted.map { it.slug })
        assertEquals(s1.resistances, s2.resistances)
    }

    // ─── Skill increase caps ──────────────────────────────────────────────────

    @Test fun `skill increase respects level caps`() {
        // Expert@3+, Master@7+, Legendary@15+
        val b = CharacterBuilder().apply {
            pcClass = "fighter"; keyAbility = STR
            choice("fighter", "fighterSkill", "athletics")
            level = 5
            skillIncrease(3, "athletics")  // trained→expert OK
            skillIncrease(5, "athletics")  // expert→master BLOCKED (need L7)
        }
        val s = b.build()
        assertEquals(Rank.EXPERT, s.skillRank(Skill.ATHLETICS), "L5 can't reach master")
        assertTrue(b.buildLog.any { "wasted" in it })
    }

    @Test fun `skill increase to master at L7 works`() {
        val b = CharacterBuilder().apply {
            pcClass = "fighter"; keyAbility = STR
            choice("fighter", "fighterSkill", "athletics")
            level = 7
            skillIncrease(3, "athletics")
            skillIncrease(7, "athletics")
        }
        assertEquals(Rank.MASTER, b.build().skillRank(Skill.ATHLETICS))
    }

    // ─── Boost math ───────────────────────────────────────────────────────────

    @Test fun `dwarf ancestry has fixed boost and flaw`() {
        // Dwarf boosts: CON (fixed), WIS (fixed), 1 free. Flaw: CHA.
        val b = CharacterBuilder().apply {
            ancestry = "dwarf"
            ancestryBoosts += STR  // fills the free slot
        }
        val s = b.build()
        assertEquals(1, s.abilityMod(CON), "fixed CON boost")
        assertEquals(1, s.abilityMod(WIS), "fixed WIS boost")
        assertEquals(1, s.abilityMod(STR), "free boost pick")
        assertEquals(-1, s.abilityMod(CHA), "flaw")
        assertEquals(0, s.abilityMod(DEX))
    }

    @Test fun `leveled boosts only apply up to current level`() {
        val b = CharacterBuilder().apply {
            level = 6  // L1 and L5 boosts apply, L10+ don't
            boostsAt(1, STR, DEX, CON, WIS)
            boostsAt(5, STR, DEX, CON, WIS)
            boostsAt(10, STR, DEX, CON, WIS)  // ignored
        }
        val s = b.build()
        assertEquals(2, s.abilityMod(STR))  // not 3
    }

    @Test fun `boostsAt rejects duplicates within a set`() {
        assertFailsWith<IllegalArgumentException> {
            CharacterBuilder().boostsAt(1, STR, STR, CON, WIS)
        }
    }

    // ─── Prerequisite evaluation ──────────────────────────────────────────────

    @Test fun `prerequisite — SkillRank met`() {
        val b = CharacterBuilder().apply {
            pcClass = "fighter"; keyAbility = STR
            choice("fighter", "fighterSkill", "athletics")
        }
        val s = b.build()
        // Titan Wrestler requires trained in Athletics
        val feat = Repository.feats["titan-wrestler"]!!
        assertTrue(b.checkPrerequisites(feat, s))
    }

    @Test fun `prerequisite — SkillRank unmet`() {
        val b = CharacterBuilder().apply { pcClass = "fighter"; keyAbility = STR }
        // No athletics training
        val s = b.build()
        val feat = Repository.feats["titan-wrestler"]!!
        assertTrue(!b.checkPrerequisites(feat, s))
    }

    @Test fun `eligible feats filters by trait level and prereqs`() {
        val b = CharacterBuilder().apply {
            level = 2
            ancestry = "human"; pcClass = "fighter"; keyAbility = STR
            choice("fighter", "fighterSkill", "athletics")
        }
        val s = b.build()
        val classFeats = b.eligibleFeats(2, FeatCategory.CLASS, s)
        // All should have fighter trait and level ≤ 2
        assertTrue(classFeats.isNotEmpty())
        assertTrue(classFeats.all { "fighter" in it.traits.value })
        assertTrue(classFeats.all { it.level <= 2 })
    }

    // ─── Open slot tracking ──────────────────────────────────────────────────

    @Test fun `open feat slots match class schedule`() {
        val b = CharacterBuilder().apply {
            level = 5
            pcClass = "fighter"; keyAbility = STR
        }
        val slots = b.openFeatSlots()
        // Fighter by L5: ancestry@1, class@1,2,4, general@3, skill@2,4, ancestry@5
        val byKind = slots.groupingBy { it.category }.eachCount()
        assertEquals(2, byKind[FeatCategory.ANCESTRY])  // L1, L5
        assertEquals(3, byKind[FeatCategory.CLASS])     // L1, L2, L4
        assertEquals(1, byKind[FeatCategory.GENERAL])   // L3
        assertEquals(2, byKind[FeatCategory.SKILL])     // L2, L4
        // None filled yet
        assertTrue(slots.all { it.filled == null })
    }

    @Test fun `open feat slots track filled`() {
        val b = CharacterBuilder().apply {
            level = 1
            pcClass = "fighter"; keyAbility = STR
            selectFeat(1, FeatCategory.CLASS, "sudden-charge")
        }
        val slots = b.openFeatSlots()
        val classSlot = slots.single { it.category == FeatCategory.CLASS }
        assertEquals("sudden-charge", classSlot.filled)
    }

    // ─── Partial builds ───────────────────────────────────────────────────────

    @Test fun `build with no selections produces valid empty state`() {
        val s = CharacterBuilder().build()
        assertEquals(1, s.level)
        assertEquals(0, s.hp())
        assertEquals(Rank.UNTRAINED, s.perception)
    }

    @Test fun `build with only ancestry applies ancestry data`() {
        val b = CharacterBuilder().apply { ancestry = "elf" }
        val s = b.build()
        assertEquals(6, s.getInt("system.attributes.ancestryhp"))  // elf HP
        assertEquals(30, s.speed)  // elf speed
        assertTrue("elf" in s.traits)
        // Elf has low-light vision
        assertTrue(s.senses.any { it.type == "low-light-vision" }, s.senses.toString())
    }
}
