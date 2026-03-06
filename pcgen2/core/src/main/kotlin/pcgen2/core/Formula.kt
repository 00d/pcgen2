package pcgen2.core

import kotlin.math.ceil
import kotlin.math.floor

/**
 * Evaluates Foundry formula strings against a [CharacterState].
 *
 * Foundry evaluates these in JavaScript (everything is a double). We mirror that:
 * arithmetic is double internally, result is truncated to Int at the boundary.
 * Division-by-zero and unknown `@scope` refs yield 0 — formulas are trusted data,
 * hard failures would brick character loading on a single bad rule.
 *
 * Grammar (covers the entire Player Core corpus — 27 unique numeric formulas):
 * ```
 *   expr    := term (('+' | '-') term)*
 *   term    := factor (('*' | '/') factor)*
 *   factor  := '-' factor | primary
 *   primary := INT | '@' IDENT ('.' IDENT)+ | IDENT '(' args? ')' | '(' expr ')'
 *   args    := expr (',' expr)*
 * ```
 *
 * Functions:
 *   ternary(cond, a, b)      — if cond≠0 then a else b
 *   match(when(c,v), ...)    — first matching branch, 0 if none
 *   gte lte gt lt eq         — comparisons → 0|1
 *   btwn(x, lo, hi)          — lo ≤ x ≤ hi → 0|1
 *   min max                  — variadic
 *   floor ceil               — IEEE floor/ceil (matches JS Math.floor for negatives)
 *   clamp(lo, x, hi)         — coerce x into [lo, hi]
 *
 * `@actor.level` → [CharacterState.level]. `@actor.system.*` and `@actor.flags.*`
 * pass through to the path map; `@actor.abilities.*` gets the `system.` prefix added
 * (Foundry exposes abilities as a top-level shortcut). `@weapon`/`@armor`/`@spell`/
 * `@target` are gameplay-time scopes — they resolve to 0 at build time, which is
 * safe because the only rules carrying them (FlatModifier, DamageAlteration) are
 * Unhandled in v1 anyway.
 */
object Formula {

    fun eval(src: String, state: CharacterState): Int = Parser(src).expr().eval(state).toInt()

    /** Cheap gate: is this string a formula or just a slug/uuid? */
    fun isFormula(s: String): Boolean = s.isNotEmpty() && (s[0] == '@' || s[0] == '-' || s[0].isDigit() ||
        s.startsWith("ternary(") || s.startsWith("match(") || s.startsWith("min(") ||
        s.startsWith("max(") || s.startsWith("floor(") || s.startsWith("ceil(") || s.startsWith("clamp("))

    // ─── AST ──────────────────────────────────────────────────────────────────

    private sealed interface Node { fun eval(s: CharacterState): Double }

    private class Lit(val v: Double) : Node { override fun eval(s: CharacterState) = v }

    private class Ref(val scope: String, val path: String) : Node {
        override fun eval(s: CharacterState): Double {
            if (scope != "actor") return 0.0
            val resolved = when {
                path == "level" -> return s.level.toDouble()
                path.startsWith("system.") || path.startsWith("flags.") -> path
                path.startsWith("abilities.") -> "system.$path"
                // Foundry exposes land speed at @actor.system.movement.speeds.land.value;
                // our state stores it at the PF2e native path.
                else -> path
            }
            return s.getInt(resolved).toDouble()
        }
    }

    private class Neg(val n: Node) : Node { override fun eval(s: CharacterState) = -n.eval(s) }

    private class Bin(val op: Char, val l: Node, val r: Node) : Node {
        override fun eval(s: CharacterState): Double {
            val a = l.eval(s); val b = r.eval(s)
            return when (op) {
                '+' -> a + b; '-' -> a - b; '*' -> a * b
                '/' -> if (b == 0.0) 0.0 else a / b
                else -> error("unreachable")
            }
        }
    }

    /** `when(cond, value)` — syntactic marker, only valid as an arg to `match`. */
    private class When(val cond: Node, val value: Node) : Node {
        override fun eval(s: CharacterState) = error("`when` outside `match`")
    }

    private class Call(val fn: String, val args: List<Node>) : Node {
        override fun eval(s: CharacterState): Double = when (fn) {
            "ternary" -> if (args[0].eval(s) != 0.0) args[1].eval(s) else args[2].eval(s)
            "match" -> args.asSequence()
                .map { it as When }
                .firstOrNull { it.cond.eval(s) != 0.0 }
                ?.value?.eval(s) ?: 0.0
            "gte"   -> bool(args[0].eval(s) >= args[1].eval(s))
            "lte"   -> bool(args[0].eval(s) <= args[1].eval(s))
            "gt"    -> bool(args[0].eval(s) >  args[1].eval(s))
            "lt"    -> bool(args[0].eval(s) <  args[1].eval(s))
            "eq"    -> bool(args[0].eval(s) == args[1].eval(s))
            "btwn"  -> { val x = args[0].eval(s); bool(x >= args[1].eval(s) && x <= args[2].eval(s)) }
            "min"   -> args.minOf { it.eval(s) }
            "max"   -> args.maxOf { it.eval(s) }
            "floor" -> floor(args[0].eval(s))
            "ceil"  -> ceil(args[0].eval(s))
            "clamp" -> args[1].eval(s).coerceIn(args[0].eval(s), args[2].eval(s))
            else    -> error("unknown formula function: $fn")
        }
        private fun bool(b: Boolean) = if (b) 1.0 else 0.0
    }

    // ─── Parser ───────────────────────────────────────────────────────────────
    // Recursive descent. No separate tokenizer — the grammar is tiny and whitespace
    // only appears between tokens in the corpus.

    private class Parser(private val src: String) {
        private var i = 0

        fun expr(): Node {
            var n = term()
            while (true) when (peek()) {
                '+' -> { i++; n = Bin('+', n, term()) }
                '-' -> { i++; n = Bin('-', n, term()) }
                else -> return n
            }
        }

        private fun term(): Node {
            var n = factor()
            while (true) when (peek()) {
                '*' -> { i++; n = Bin('*', n, factor()) }
                '/' -> { i++; n = Bin('/', n, factor()) }
                else -> return n
            }
        }

        private fun factor(): Node {
            if (peek() == '-') { i++; return Neg(factor()) }
            return primary()
        }

        private fun primary(): Node = when {
            peek() == '(' -> { i++; expr().also { expect(')') } }
            peek() == '@' -> ref()
            peek().isDigit() -> num()
            peek().isLetter() -> call()
            else -> err("unexpected char '${peek()}'")
        }

        private fun ref(): Node {
            i++  // consume @
            val start = i
            while (i < src.length && (src[i].isLetterOrDigit() || src[i] == '.' || src[i] == '_')) i++
            val full = src.substring(start, i)
            val dot = full.indexOf('.')
            require(dot > 0) { "malformed @ref at $start in: $src" }
            return Ref(full.take(dot), full.substring(dot + 1))
        }

        private fun num(): Node {
            val start = i
            while (i < src.length && src[i].isDigit()) i++
            return Lit(src.substring(start, i).toDouble())
        }

        private fun call(): Node {
            val start = i
            while (i < src.length && src[i].isLetter()) i++
            val name = src.substring(start, i)
            expect('(')
            val args = buildList {
                if (peek() != ')') {
                    add(expr())
                    while (peek() == ',') { i++; add(expr()) }
                }
            }
            expect(')')
            return if (name == "when") When(args[0], args[1]) else Call(name, args)
        }

        private fun peek(): Char {
            while (i < src.length && src[i] == ' ') i++
            return if (i < src.length) src[i] else '\u0000'
        }
        private fun expect(c: Char) { if (peek() != c) err("expected '$c', got '${peek()}'"); i++ }
        private fun err(msg: String): Nothing = error("$msg at $i in: $src")
    }
}
