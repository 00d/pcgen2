package pcgen2.data

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RepositoryTest {

    @Test
    fun `all packs load with expected counts`() {
        assertEquals(8, Repository.ancestries.size, "ancestries")
        assertEquals(49, Repository.heritages.size, "heritages")
        assertEquals(40, Repository.backgrounds.size, "backgrounds")
        assertEquals(8, Repository.classes.size, "classes")
        // Class features include transitively-referenced ones; exact count varies
        assertTrue(Repository.classFeatures.size >= 164, "classFeatures (expected ≥164, got ${Repository.classFeatures.size})")
        assertEquals(848, Repository.feats.size, "feats")
        assertEquals(489, Repository.spells.size, "spells")
    }

    @Test
    fun `direct-filtered items are ORC Player Core`() {
        // Class features are excluded: some are transitively included from other books
        // (Foundry deduplicates shared features like Weapon Specialization across classes).
        val all = Repository.ancestries.values + Repository.heritages.values + Repository.backgrounds.values +
            Repository.classes.values + Repository.feats.values + Repository.spells.values
        all.forEach { item ->
            val pub = when (item) {
                is Ancestry -> item.publication; is Heritage -> item.publication; is Background -> item.publication
                is PCClass -> item.publication; is Feat -> item.publication; is Spell -> item.publication
                else -> error("unreachable")
            }
            assertEquals("ORC", pub.license, "${item.slug} not ORC licensed")
            assertTrue(pub.remaster, "${item.slug} not remastered")
            assertEquals("Pathfinder Player Core", pub.title, "${item.slug} wrong publication")
        }
    }

    @Test
    fun `class features are all remastered even if transitively included`() {
        // A handful of shared features (perception-expertise etc.) were entered in Foundry
        // under pre-Remaster OGL books but are mechanically identical to the ORC versions.
        // We assert remaster==true, which guarantees the rules content is current.
        Repository.classFeatures.values.forEach { cf ->
            assertTrue(cf.publication.remaster, "${cf.slug} not remastered (${cf.publication.title})")
        }
    }

    @Test
    fun `fighter class has expected structure`() {
        val fighter = Repository.classes["fighter"]!!
        assertEquals("Fighter", fighter.name)
        assertEquals(10, fighter.hp)
        assertEquals(setOf(Ability.DEX, Ability.STR), fighter.keyAbility.toSet())
        assertEquals(2, fighter.perception)
        assertEquals(2, fighter.savingThrows.fortitude)
        assertEquals(2, fighter.savingThrows.reflex)
        assertEquals(1, fighter.savingThrows.will)
        assertEquals(2, fighter.attacks.martial)
        assertEquals(1, fighter.defenses.heavy)
        assertEquals(3, fighter.additionalSkills)
        assertTrue(1 in fighter.classFeatLevels)
        assertTrue(20 in fighter.classFeatLevels)
        assertTrue(3 in fighter.skillIncreaseLevels)
    }

    @Test
    fun `fighter class features resolve in classFeatures pack`() {
        val fighter = Repository.classes["fighter"]!!
        val unresolved = fighter.classFeatures.filter { it.slug !in Repository.classFeatures }
        assertTrue(unresolved.isEmpty(), "unresolved fighter features: ${unresolved.map { it.slug }}")

        val reactiveStrike = Repository.classFeatures["reactive-strike"]
        assertNotNull(reactiveStrike)
        assertEquals("Reactive Strike", reactiveStrike.name)
    }

    @Test
    fun `all class features across all classes resolve`() {
        val missing = mutableListOf<String>()
        Repository.classes.values.forEach { cls ->
            cls.classFeatures.forEach { grant ->
                if (grant.slug !in Repository.classFeatures) missing += "${cls.slug} → ${grant.slug}"
            }
        }
        assertTrue(missing.isEmpty(), "unresolved class features: $missing")
    }

    @Test
    fun `heritage ancestry slugs resolve`() {
        val unresolved = Repository.heritages.values
            .filter { it.ancestrySlug != null && it.ancestrySlug !in Repository.ancestries }
        assertTrue(unresolved.isEmpty(), "unresolved heritage→ancestry: ${unresolved.map { "${it.slug}→${it.ancestrySlug}" }}")
    }

    @Test
    fun `heritagesFor returns bound plus versatile`() {
        val humanHeritages = Repository.heritagesFor("human")
        assertTrue(humanHeritages.any { it.slug == "skilled-human" })
        assertTrue(humanHeritages.any { it.ancestrySlug == null }, "should include versatile heritages")
        assertTrue(humanHeritages.none { it.ancestrySlug == "dwarf" })
    }

    @Test
    fun `fighter ChoiceSet rule deserializes correctly`() {
        val fighter = Repository.classes["fighter"]!!
        val choice = fighter.rules.filterIsInstance<RuleElement.ChoiceSet>().single()
        assertEquals("fighterSkill", choice.flag)

        val ael = fighter.rules.filterIsInstance<RuleElement.ActiveEffectLike>().single()
        assertEquals("system.skills.{item|flags.system.rulesSelections.fighterSkill}.rank", ael.path)
        assertEquals(RuleElement.ActiveEffectLike.Mode.upgrade, ael.mode)
    }

    @Test
    fun `feat prerequisites are structured not manual for skill patterns`() {
        // Regression: any feat with a "trained/expert/master/legendary in X" prereq
        // should parse to SkillRank, never Manual.
        Repository.feats.values.forEach { feat ->
            feat.prerequisites.forEach { p ->
                if (p is Predicate.Manual) {
                    val t = p.text.lowercase()
                    assertTrue(
                        !Regex("^(trained|expert|master|legendary) in \\w+$").matches(t),
                        "skill-pattern prereq fell through to Manual: ${feat.slug} — ${p.text}"
                    )
                }
            }
        }
    }

    @Test
    fun `intimidating glare has SkillRank prerequisite`() {
        val feat = Repository.feats["intimidating-glare"]!!
        assertEquals(1, feat.prerequisites.size)
        val p = feat.prerequisites[0]
        assertTrue(p is Predicate.SkillRank)
        p as Predicate.SkillRank
        assertEquals("intimidation", p.skill)
        assertEquals(Rank.TRAINED, p.rank)
    }

    @Test
    fun `background grants are structured`() {
        val acolyte = Repository.backgrounds["acolyte"]!!
        assertTrue("religion" in acolyte.trainedSkills)
        assertTrue(acolyte.trainedLore.any { "Scribing" in it })
        assertNotNull(acolyte.grantedFeat)
        assertEquals("Student of the Canon", acolyte.grantedFeat!!.name)
    }

    @Test
    fun `human ancestry has two free boosts`() {
        val human = Repository.ancestries["human"]!!
        assertEquals(8, human.hp)
        assertEquals(25, human.speed)
        // Human has 2 boost slots each with all 6 abilities (= free), plus a 3rd empty slot
        val nonEmpty = human.boosts.filter { it.isNotEmpty() }
        assertEquals(2, nonEmpty.size)
        assertTrue(nonEmpty.all { it.size == 6 })
        assertTrue(human.flaws.all { it.isEmpty() })
    }

    @Test
    fun `fireball spell deserializes correctly`() {
        val fireball = Repository.spells["fireball"]!!
        assertEquals(3, fireball.level)
        assertEquals(listOf("arcane", "primal"), fireball.traditions)
        assertEquals("2", fireball.time)
        assertEquals("500 feet", fireball.range)
        assertEquals("burst", fireball.area?.type)
        assertEquals(20, fireball.area?.value)
        assertEquals("reflex", fireball.defense?.statistic)
        assertTrue(fireball.defense!!.basic)
        assertEquals("6d6", fireball.damage[0].formula)
        assertEquals("fire", fireball.damage[0].type)
    }

    @Test
    fun `resolveUuid finds items by compendium name`() {
        val bravery = Repository.resolveUuid("Compendium.pf2e.classfeatures.Item.Bravery")
        assertNotNull(bravery)
        assertEquals("bravery", bravery.slug)

        val suddenCharge = Repository.resolveUuid("Compendium.pf2e.feats-srd.Item.Sudden Charge")
        assertNotNull(suddenCharge)
        assertEquals("sudden-charge", suddenCharge.slug)

        // Unresolvable (pack we don't ship, name doesn't collide) → null, not exception
        assertEquals(null, Repository.resolveUuid("Compendium.pf2e.spell-effects.Item.Spell Effect: Shield"))
    }

    @Test
    fun `rule element unhandled types preserve raw json`() {
        // Find an item with a RollOption (common unhandled type)
        val withUnhandled = Repository.feats.values.firstOrNull { feat ->
            feat.rules.any { it is RuleElement.Unhandled && it.key == "RollOption" }
        }
        assertNotNull(withUnhandled, "no feat with RollOption found")
        val unhandled = withUnhandled.rules.filterIsInstance<RuleElement.Unhandled>().first { it.key == "RollOption" }
        assertTrue(unhandled.raw.containsKey("key"))
    }
}
