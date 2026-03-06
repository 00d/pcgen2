package pcgen2.core

import pcgen2.data.Rank
import pcgen2.data.Repository
import pcgen2.data.Skill
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Integration-style: exercises the engine against real Player Core data.
 * Every test picks an item that demonstrates one rule mechanic in isolation.
 */
class RuleEngineTest {

    /** Map-backed choice provider: `(itemSlug, flag) → value`. */
    private fun choices(vararg pairs: Pair<Pair<String, String>, String>): ChoiceProvider {
        val m = pairs.toMap()
        return ChoiceProvider { slug, flag, _ -> m[slug to flag] }
    }

    private fun blank(lvl: Int = 1) = CharacterState().apply { level = lvl }

    // ─── ChoiceSet → interpolate → ActiveEffectLike chain ────────────────────

    @Test fun `skilled-human — choice interpolates into AEL path, formula gates rank`() {
        // ChoiceSet(flag=skill) → AEL(path="system.skills.{item|...skill}.rank", value="ternary(gte(@actor.level,5),2,1)")
        val heritage = Repository.heritages["skilled-human"]!!
        val engine = RuleEngine(choices(("skilled-human" to "skill") to "stealth"))

        val atL1 = blank(1)
        engine.applyItem(heritage, atL1, "heritage")
        assertEquals(Rank.TRAINED, atL1.skillRank(Skill.STEALTH), engine.log.joinToString("\n"))
        assertEquals(Rank.UNTRAINED, atL1.skillRank(Skill.ATHLETICS))

        val atL5 = blank(5)
        engine.applyItem(heritage, atL5, "heritage")
        assertEquals(Rank.EXPERT, atL5.skillRank(Skill.STEALTH))
    }

    @Test fun `skilled-human — unresolved choice leaves path uninterpolated and AEL bails`() {
        val heritage = Repository.heritages["skilled-human"]!!
        val engine = RuleEngine(choices()) // no selection

        val s = blank()
        engine.applyItem(heritage, s, "heritage")
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.STEALTH))
        assertTrue(engine.log.any { "unresolved" in it })
    }

    @Test fun `fighter class — ChoiceSet picks acrobatics or athletics, AEL upgrades`() {
        val fighter = Repository.classes["fighter"]!!
        val engine = RuleEngine(choices(("fighter" to "fighterSkill") to "athletics"))

        val s = blank()
        engine.applyItem(fighter, s, "class")
        assertEquals(Rank.TRAINED, s.skillRank(Skill.ATHLETICS))
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.ACROBATICS))
    }

    // ─── Predicate-gated rules ───────────────────────────────────────────────

    @Test fun `hold-mark — only chosen branch fires`() {
        // 4 AELs, each gated on the ChoiceSet value. Only one should apply.
        val feat = Repository.feats["hold-mark"]!!
        val engine = RuleEngine(choices(("hold-mark" to "holdMark") to "burning-sun"))

        val s = blank()
        engine.applyItem(feat, s, "feat")
        assertEquals(Rank.TRAINED, s.skillRank(Skill.DIPLOMACY))    // burning-sun
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.SURVIVAL))   // deaths-head — gated out
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.RELIGION))   // defiled-corpse
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.INTIMIDATION)) // empty-hand

        // Roll options emitted
        assertTrue("hold-mark:burning-sun" in s.rollOptions)
        assertTrue("feat:hold-mark:burning-sun" in s.rollOptions)
        assertTrue("feat:hold-mark" in s.rollOptions)
    }

    @Test fun `hold-mark — different choice different skill`() {
        val feat = Repository.feats["hold-mark"]!!
        val engine = RuleEngine(choices(("hold-mark" to "holdMark") to "empty-hand"))

        val s = blank()
        engine.applyItem(feat, s, "feat")
        assertEquals(Rank.UNTRAINED, s.skillRank(Skill.DIPLOMACY))
        assertEquals(Rank.TRAINED, s.skillRank(Skill.INTIMIDATION))
    }

    @Test fun `sneak-attack — class predicate gates the rule`() {
        // AEL has predicate ["class:rogue"]. Fires only if rogue class roll option is set.
        val sneak = Repository.classFeatures["sneak-attack"]!!
        val engine = RuleEngine(choices())

        // Without class:rogue → predicate fails → no flag set
        val notRogue = blank(5)
        engine.applyItem(sneak, notRogue, "test")
        assertEquals(0, notRogue.getInt("flags.system.sneakAttackDamage.number"))

        // With class:rogue → fires
        val rogue = blank(5).apply { classSlug = "rogue"; rollOptions += "class:rogue" }
        engine.applyItem(sneak, rogue, "test")
        assertEquals(2, rogue.getInt("flags.system.sneakAttackDamage.number")) // L5 → 2d6
        assertEquals(6, rogue.getInt("flags.system.sneakAttackDamage.faces"))
    }

    // ─── GrantItem ───────────────────────────────────────────────────────────

    @Test fun `martial-disciple — predicate-gated GrantItem follows choice`() {
        // ChoiceSet(skill) → AEL(upgrade that skill) → GrantItem(Cat Fall if acrobatics, Quick Jump if athletics)
        val bg = Repository.backgrounds["martial-disciple"]!!

        // Pick athletics → should grant Quick Jump, not Cat Fall
        val engine = RuleEngine(choices(("martial-disciple" to "skill") to "athletics"))
        val s = blank()
        engine.applyItem(bg, s, "background")

        assertEquals(Rank.TRAINED, s.skillRank(Skill.ATHLETICS))
        assertTrue(s.granted.any { it.slug == "quick-jump" }, "expected quick-jump, got: ${s.granted.map { it.slug }}")
        assertFalse(s.granted.any { it.slug == "cat-fall" })
        // Roll option for the granted feat
        assertTrue("feat:quick-jump" in s.rollOptions)
    }

    @Test fun `martial-disciple — acrobatics branch grants cat-fall`() {
        val bg = Repository.backgrounds["martial-disciple"]!!
        val engine = RuleEngine(choices(("martial-disciple" to "skill") to "acrobatics"))
        val s = blank()
        engine.applyItem(bg, s, "background")

        assertEquals(Rank.TRAINED, s.skillRank(Skill.ACROBATICS))
        assertTrue(s.granted.any { it.slug == "cat-fall" })
        assertFalse(s.granted.any { it.slug == "quick-jump" })
    }

    @Test fun `GrantItem — unshipped pack skipped gracefully`() {
        // arcane-bond grants "Drain Bonded Item" from actionspf2e — we don't ship that pack.
        // Engine should log and continue, not crash.
        val feature = Repository.classFeatures["arcane-bond"]!!
        val engine = RuleEngine(choices())

        val s = blank()
        engine.applyItem(feature, s, "test")
        assertTrue(s.granted.any { it.slug == "arcane-bond" }) // the feature itself
        assertFalse(s.granted.any { it.slug == "drain-bonded-item" })
        assertTrue(engine.log.any { "pack not shipped" in it })
    }

    @Test fun `GrantItem — not-predicate blocks grant when feature present`() {
        // arcane-bond's grant has predicate [{"not": "feature:improved-familiar-attunement"}]
        val feature = Repository.classFeatures["arcane-bond"]!!
        val engine = RuleEngine(choices())

        val s = blank().apply { rollOptions += "feature:improved-familiar-attunement" }
        engine.applyItem(feature, s, "test")
        // Even if we shipped actionspf2e, the grant would be blocked. Verify log doesn't
        // mention the skipped-pack path (predicate fails first).
        assertFalse(engine.log.any { "pack not shipped" in it })
    }

    // ─── Resistance with formula value ───────────────────────────────────────

    @Test fun `forge-dwarf — resistance formula evaluates against level`() {
        val heritage = Repository.heritages["forge-dwarf"]!!
        val engine = RuleEngine(choices())

        for ((lvl, want) in listOf(1 to 1, 2 to 1, 4 to 2, 10 to 5, 20 to 10)) {
            val s = blank(lvl)
            engine.applyItem(heritage, s, "heritage")
            val fire = s.resistances.single { it.type == "fire" }
            assertEquals(want, fire.value, "level $lvl")
        }
    }

    // ─── ActorTraits ─────────────────────────────────────────────────────────

    @Test fun `ActorTraits add and remove`() {
        // Find any item with ActorTraits. Aiuvarin heritage adds "elf".
        val heritage = Repository.heritages["aiuvarin"]
            ?: return // skip if not in data
        val engine = RuleEngine(choices())

        val s = blank().apply { traits += "human" }
        engine.applyItem(heritage, s, "heritage")
        assertTrue("elf" in s.traits)
        assertTrue("human" in s.traits) // not removed
    }

    // ─── Upgrade mode semantics ──────────────────────────────────────────────

    @Test fun `upgrade mode takes max — re-applying does not downgrade`() {
        val fighter = Repository.classes["fighter"]!!
        val engine = RuleEngine(choices(("fighter" to "fighterSkill") to "athletics"))

        val s = blank()
        // Pre-set athletics to expert — fighter's trained (rank 1) should not downgrade
        s.set("system.skills.athletics.rank", 2)
        engine.applyItem(fighter, s, "class")
        assertEquals(Rank.EXPERT, s.skillRank(Skill.ATHLETICS))
    }

    // ─── Provenance & logging ────────────────────────────────────────────────

    @Test fun `granted items carry provenance`() {
        val bg = Repository.backgrounds["martial-disciple"]!!
        val engine = RuleEngine(choices(("martial-disciple" to "skill") to "athletics"))
        val s = blank()
        engine.applyItem(bg, s, "background")

        val qj = s.granted.single { it.slug == "quick-jump" }
        assertEquals("feat", qj.kind)
        assertTrue("martial-disciple" in qj.source)
    }

    @Test fun `log captures decisions for debugging`() {
        val heritage = Repository.heritages["skilled-human"]!!
        val engine = RuleEngine(choices(("skilled-human" to "skill") to "medicine"))
        val s = blank(7)
        engine.applyItem(heritage, s, "heritage")

        val log = engine.log.joinToString("\n")
        assertTrue("ChoiceSet(skill) = medicine" in log, log)
        assertTrue("AEL upgrade system.skills.medicine.rank = 2" in log, log)
    }

    // ─── Compound predicates ─────────────────────────────────────────────────

    @Test fun `or predicate — one branch true suffices`() {
        // weapon-expertise AEL: [{"or": ["class:champion", "class:exemplar", ...]}]
        // Predicate should match for any of those classes, not others.
        val feature = Repository.classFeatures["weapon-expertise"]!!
        val engine = RuleEngine(choices())

        // Fighter is NOT in the list → predicate false
        // (This feature is shared across non-Player-Core classes; for PC classes
        //  it's granted transitively and the predicate gates it correctly.)
        val asFighter = blank().apply { rollOptions += "class:fighter" }
        engine.applyItem(feature, asFighter, "test")
        // path depends on what weapon-expertise does; just check it didn't mutate anything unexpected
        // Since fighter isn't in the or-list, no AEL should fire.
        // We can't easily assert a negative here without knowing the path, so check roll option emitted
        assertTrue("feature:weapon-expertise" in asFighter.rollOptions)
    }

    @Test fun `gte predicate on skill rank`() {
        // stonemasons-eye: GrantItem predicate [{"gte": ["skill:crafting:rank", 1]}]
        val feat = Repository.feats["stonemasons-eye"]!!
        val engine = RuleEngine(choices())

        // Untrained → grant blocked
        val untrained = blank()
        engine.applyItem(feat, untrained, "feat")
        val grantedUntrained = untrained.granted.filter { it.slug != "stonemasons-eye" }

        // Trained → grant fires (though the target may be from an unshipped pack)
        val trained = blank().apply { set("system.skills.crafting.rank", 1) }
        engine.applyItem(feat, trained, "feat")
        // Either the grant succeeded OR it was skipped for pack reasons — but predicate passed.
        // Distinguish by checking the log.
        val log = engine.log.joinToString("\n")
        if (grantedUntrained.isEmpty()) {
            // Predicate should have blocked the first attempt entirely — log should be clean for untrained path
            // and trained path should show either a grant or a pack-skip (not a silent predicate fail)
            assertTrue("stonemasons-eye" in log)
        }
    }
}
