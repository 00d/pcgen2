package pcgen2.core

import pcgen2.data.Ability
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Exhaustive over the Player Core formula corpus. Every ActiveEffectLike formula
 * has a table-driven case; Resistance/BaseSpeed formulas are spot-checked.
 * If adding a new rule type that carries formulas, add its corpus here.
 */
class FormulaTest {

    private fun state(lvl: Int = 1, block: CharacterState.() -> Unit = {}): CharacterState =
        CharacterState().apply { level = lvl; block() }

    // ─── Primitives & arithmetic ──────────────────────────────────────────────

    @Test fun `literals and arithmetic`() {
        val s = state()
        assertEquals(7, Formula.eval("7", s))
        assertEquals(-3, Formula.eval("-3", s))
        assertEquals(9, Formula.eval("2 + 3 + 4", s))
        assertEquals(14, Formula.eval("2 + 3 * 4", s))       // precedence
        assertEquals(20, Formula.eval("(2 + 3) * 4", s))     // grouping
        assertEquals(1, Formula.eval("10 - 3 * 3", s))
        assertEquals(2, Formula.eval("10 / 4", s))           // truncation at boundary
        assertEquals(0, Formula.eval("3 / 0", s))            // div0 → 0, not crash
        assertEquals(-4, Formula.eval("2 - 2 - 4", s))       // left-assoc
    }

    @Test fun `floor uses IEEE semantics not truncation`() {
        // JS Math.floor(-1.5) = -2. Kotlin Int -3/2 = -1. We must match JS.
        val s = state()
        assertEquals(-2, Formula.eval("floor(-3 / 2)", s))
        assertEquals(2, Formula.eval("floor(5 / 2)", s))
        assertEquals(3, Formula.eval("ceil(5 / 2)", s))
        assertEquals(-1, Formula.eval("ceil(-3 / 2)", s))
    }

    @Test fun `clamp pins to bounds`() {
        val s = state()
        assertEquals(-2, Formula.eval("clamp(-2, -5, 0)", s))
        assertEquals(0, Formula.eval("clamp(-2, 3, 0)", s))
        assertEquals(-1, Formula.eval("clamp(-2, -1, 0)", s))
    }

    // ─── @actor path resolution ───────────────────────────────────────────────

    @Test fun `actor level shortcut`() {
        assertEquals(7, Formula.eval("@actor.level", state(7)))
        assertEquals(14, Formula.eval("@actor.level * 2", state(7)))
    }

    @Test fun `actor system path passes through`() {
        val s = state { set("system.skills.society.rank", 3) }
        assertEquals(3, Formula.eval("@actor.system.skills.society.rank", s))
    }

    @Test fun `actor flags path passes through`() {
        val s = state { set("flags.system.multilingualTaken", 2) }
        assertEquals(2, Formula.eval("@actor.flags.system.multilingualTaken", s))
    }

    @Test fun `actor abilities shortcut gains system prefix`() {
        val s = state { setAbilityMod(Ability.CON, 4) }
        assertEquals(4, Formula.eval("@actor.abilities.con.mod", s))
    }

    @Test fun `non-actor scopes degrade to zero`() {
        // @weapon/@armor/@spell/@target are gameplay-time — only appear in Unhandled rules.
        val s = state()
        assertEquals(0, Formula.eval("@weapon.system.damage.dice", s))
        assertEquals(5, Formula.eval("5 + @armor.system.runes.potency", s))
        assertEquals(0, Formula.eval("2 * @target.conditions.frightened.badge.value", s))
    }

    @Test fun `missing actor path degrades to zero`() {
        assertEquals(0, Formula.eval("@actor.system.does.not.exist", state()))
    }

    // ─── ActiveEffectLike corpus — these MUST be correct for build validity ───

    @Test fun `skilled-human — ternary gte level 5`() {
        // At 5th level, you become an expert (rank 2) in the chosen skill.
        val f = "ternary(gte(@actor.level,5),2,1)"
        assertEquals(1, Formula.eval(f, state(1)))
        assertEquals(1, Formula.eval(f, state(4)))
        assertEquals(2, Formula.eval(f, state(5)))
        assertEquals(2, Formula.eval(f, state(20)))
    }

    @Test fun `armor-proficiency — ternary gte level 13`() {
        val f = "ternary(gte(@actor.level,13),2,1)"
        assertEquals(1, Formula.eval(f, state(12)))
        assertEquals(2, Formula.eval(f, state(13)))
    }

    @Test fun `canny-acumen — ternary gte level 17`() {
        // Expert → Master at L17.
        val f = "ternary(gte(@actor.level,17),3,2)"
        assertEquals(2, Formula.eval(f, state(1)))
        assertEquals(2, Formula.eval(f, state(16)))
        assertEquals(3, Formula.eval(f, state(17)))
    }

    @Test fun `sneak-attack — nested ternary four-way`() {
        // 1d6 at L1, +1d6 at 5/11/17.
        val f = "ternary(lt(@actor.level, 5), 1, ternary(lt(@actor.level, 11), 2, ternary(lt(@actor.level, 17), 3, 4)))"
        for ((lvl, want) in listOf(1 to 1, 4 to 1, 5 to 2, 10 to 2, 11 to 3, 16 to 3, 17 to 4, 20 to 4)) {
            assertEquals(want, Formula.eval(f, state(lvl)), "level $lvl")
        }
    }

    @Test fun `sneak-attacker — ternary lt`() {
        val f = "ternary(lt(@actor.level, 6), 4, 6)"
        assertEquals(4, Formula.eval(f, state(5)))
        assertEquals(6, Formula.eval(f, state(6)))
    }

    @Test fun `multilingual — nested ternary on skill rank`() {
        // Bonus languages: legendary=2, master=1, else 0.
        val f = "ternary(eq(@actor.system.skills.society.rank, 4), 2, ternary(eq(@actor.system.skills.society.rank, 3), 1, 0))"
        fun at(rank: Int) = Formula.eval(f, state { set("system.skills.society.rank", rank) })
        assertEquals(0, at(0))
        assertEquals(0, at(1))
        assertEquals(0, at(2))
        assertEquals(1, at(3))
        assertEquals(2, at(4))
    }

    @Test fun `familiar-witch — min floor composition`() {
        // 2 + min(3, floor(level/6)). Caps at 5 once level ≥ 18.
        val f = "2 + min(3,floor(@actor.level / 6))"
        assertEquals(2, Formula.eval(f, state(1)))   // 2 + min(3, 0)
        assertEquals(2, Formula.eval(f, state(5)))
        assertEquals(3, Formula.eval(f, state(6)))   // 2 + min(3, 1)
        assertEquals(4, Formula.eval(f, state(12)))
        assertEquals(5, Formula.eval(f, state(18)))
        assertEquals(5, Formula.eval(f, state(20)))  // clamped at 3
    }

    @Test fun `improved-familiar-attunement — match with btwn`() {
        val f = "match(when(lte(@actor.level, 5), 1), when(btwn(@actor.level, 6, 11), 2), " +
                "when(btwn(@actor.level, 12, 17), 3), when(gte(@actor.level, 18), 4))"
        for ((lvl, want) in listOf(1 to 1, 5 to 1, 6 to 2, 11 to 2, 12 to 3, 17 to 3, 18 to 4, 20 to 4)) {
            assertEquals(want, Formula.eval(f, state(lvl)), "level $lvl")
        }
    }

    @Test fun `breath-control — arithmetic with ability deref`() {
        // "You can hold your breath for 25 × (5 + CON) rounds."
        val f = "25 * (5 + @actor.abilities.con.mod)"
        assertEquals(125, Formula.eval(f, state { setAbilityMod(Ability.CON, 0) }))
        assertEquals(200, Formula.eval(f, state { setAbilityMod(Ability.CON, 3) }))
        assertEquals(100, Formula.eval(f, state { setAbilityMod(Ability.CON, -1) }))
    }

    @Test fun `warpriests-armor — raw path deref`() {
        // "Your heavy armor prof equals your medium armor prof."
        val s = state { set("system.proficiencies.defenses.medium.rank", 2) }
        assertEquals(2, Formula.eval("@actor.system.proficiencies.defenses.medium.rank", s))
    }

    @Test fun `nomadic-halfling — flag counter deref`() {
        val s = state { set("flags.system.multilingualTaken", 3) }
        assertEquals(3, Formula.eval("@actor.flags.system.multilingualTaken", s))
    }

    @Test fun `deny-advantage and hillock-halfling — bare level`() {
        assertEquals(9, Formula.eval("@actor.level", state(9)))
    }

    // ─── Resistance corpus (display-only, still want correct) ─────────────────

    @Test fun `heritage resistances — max 1 floor half-level`() {
        // arctic-elf, charhide-goblin, forge-dwarf, grave-orc, snow-goblin, strong-blooded-dwarf
        val f = "max(1,floor(@actor.level/2))"
        assertEquals(1, Formula.eval(f, state(1)))   // floor(0.5)=0 → max(1,0)=1
        assertEquals(1, Formula.eval(f, state(2)))
        assertEquals(1, Formula.eval(f, state(3)))
        assertEquals(2, Formula.eval(f, state(4)))
        assertEquals(10, Formula.eval(f, state(20)))
    }

    @Test fun `poison-resistance — floor half-level no floor`() {
        val f = "floor(@actor.level/2)"
        assertEquals(0, Formula.eval(f, state(1)))
        assertEquals(3, Formula.eval(f, state(7)))
    }

    // ─── match edge cases ─────────────────────────────────────────────────────

    @Test fun `match with no matching branch returns zero`() {
        // deadly-aim starts at L8; below that no branch fires.
        val f = "match(when(btwn(@actor.level, 8, 10), 4), when(btwn(@actor.level, 11, 14), 6), when(gte(@actor.level, 15), 8))"
        assertEquals(0, Formula.eval(f, state(1)))
        assertEquals(0, Formula.eval(f, state(7)))
        assertEquals(4, Formula.eval(f, state(8)))
        assertEquals(8, Formula.eval(f, state(20)))
    }

    @Test fun `match short-circuits at first true branch`() {
        // Overlapping conditions — first wins.
        val f = "match(when(gte(@actor.level, 1), 99), when(gte(@actor.level, 1), 0))"
        assertEquals(99, Formula.eval(f, state(5)))
    }

    // ─── Parser error modes ───────────────────────────────────────────────────

    @Test fun `unknown function is loud`() {
        assertFailsWith<IllegalStateException> { Formula.eval("frobnicate(1)", state()) }
    }

    @Test fun `unbalanced parens fail`() {
        assertFailsWith<IllegalStateException> { Formula.eval("(1 + 2", state()) }
    }

    @Test fun `when outside match fails`() {
        assertFailsWith<IllegalStateException> { Formula.eval("when(1, 2)", state()) }
    }

    @Test fun `whitespace is irrelevant`() {
        assertEquals(
            Formula.eval("ternary(gte(@actor.level,5),2,1)", state(5)),
            Formula.eval("ternary ( gte ( @actor.level , 5 ) , 2 , 1 )", state(5)),
        )
    }

    // ─── isFormula gate ───────────────────────────────────────────────────────

    @Test fun `isFormula distinguishes formulas from string values`() {
        assertTrue(Formula.isFormula("@actor.level"))
        assertTrue(Formula.isFormula("ternary(gte(@actor.level,5),2,1)"))
        assertTrue(Formula.isFormula("2 + min(3,floor(@actor.level / 6))"))
        assertTrue(Formula.isFormula("max(1,floor(@actor.level/2))"))
        assertTrue(Formula.isFormula("-3"))
        assertTrue(Formula.isFormula("floor(@actor.level/2)"))

        // String slugs and UUIDs — NOT formulas, pass through unchanged.
        assertFalse(Formula.isFormula("aiuvarin"))
        assertFalse(Formula.isFormula("arcane"))
        assertFalse(Formula.isFormula("Compendium.pf2e.spell-effects.Item.Spell Effect: Shield"))
        assertFalse(Formula.isFormula("{item|flags.system.rulesSelections.ancestry}"))
        assertFalse(Formula.isFormula(""))
    }
}
