package pcgen2.core

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import pcgen2.data.ClassFeature
import pcgen2.data.Feat
import pcgen2.data.GameItem
import pcgen2.data.Rank
import pcgen2.data.Repository
import pcgen2.data.RuleElement

/**
 * Supplies ChoiceSet selections. Engine calls this with the owning item's slug
 * and the rule's flag; resolver returns the chosen value (or null = no selection).
 *
 * Returned value semantics depend on the ChoiceSet shape:
 *   - static array / `config:"skills"` → slug string (`"athletics"`, `"fire"`)
 *   - filter query → Compendium UUID (feeds directly into GrantItem interpolation)
 *
 * For tests, back with a `Map<Pair<itemSlug,flag>, String>`. For UI, present
 * the options computed by [RuleEngine.describeChoice] and return the user's pick.
 */
fun interface ChoiceProvider {
    fun resolve(itemSlug: String, flag: String, rule: RuleElement.ChoiceSet): String?
}

/**
 * Applies Foundry rule elements to a [CharacterState].
 *
 * Model: items are applied one at a time, rules within each item in **array order**.
 * This matches the corpus — every ChoiceSet precedes the AEL/GrantItem that
 * interpolates its flag. Explicit priorities only matter for cross-item AEL
 * ordering, which `upgrade` mode makes irrelevant (max is commutative).
 *
 * GrantItem recurses — depth-bounded to catch data cycles. Unresolved UUIDs
 * (packs we don't ship: actionspf2e, conditionitems) are skipped silently;
 * those grant Foundry convenience items that don't affect build validity.
 */
class RuleEngine(
    private val choices: ChoiceProvider,
    private val repo: Repository = Repository,
) {
    /** Diagnostic log — what the engine decided and why. Read-only after a build. */
    val log = mutableListOf<String>()

    /**
     * Applies an item: emits its roll option, records it as granted, then walks
     * its rules. [source] is a human-readable provenance string (e.g. `"class"`,
     * `"fighter→bravery"`).
     */
    fun applyItem(item: GameItem, state: CharacterState, source: String, level: Int = state.level, depth: Int = 0) {
        if (depth > 8) { log += "!! grant cycle at ${item.slug}, bailing"; return }

        val kind = item.kind()
        state.granted += GrantedItem(item.slug, item.name, kind, level, source)
        state.rollOptions += "$kind:${item.slug}"

        for (rule in item.rules) applyRule(rule, item, state, source, depth)
    }

    private fun applyRule(rule: RuleElement, item: GameItem, state: CharacterState, source: String, depth: Int) {
        when (rule) {
            is RuleElement.ChoiceSet -> {
                val value = choices.resolve(item.slug, rule.flag, rule) ?: run {
                    log += "  ? ${item.slug} ChoiceSet(${rule.flag}) unresolved"
                    return
                }
                state.setItemFlag(item.slug, rule.flag, value)
                // Emit roll options for predicate matching. Slug-form values only
                // (UUID values feed GrantItem interpolation, not predicates).
                if (!value.startsWith("Compendium.")) {
                    state.rollOptions += "${item.slug}:$value"
                    state.rollOptions += "${item.kind()}:${item.slug}:$value"
                }
                log += "  ${item.slug} ChoiceSet(${rule.flag}) = $value"
            }

            is RuleElement.GrantItem -> {
                if (!checkPredicate(rule.predicate, state)) return
                val uuid = interpolate(rule.uuid, item.slug, state)
                if (uuid.isBlank() || uuid.contains("{")) {
                    log += "  ? ${item.slug} GrantItem unresolved template: ${rule.uuid}"
                    return
                }
                val granted = repo.resolveUuid(uuid) ?: run {
                    // Expected for actionspf2e, conditionitems, equipment-srd — not errors.
                    log += "  ~ ${item.slug} GrantItem skipped (pack not shipped): $uuid"
                    return
                }
                if (!rule.allowDuplicate && state.granted.any { it.slug == granted.slug }) {
                    log += "  ~ ${item.slug} GrantItem duplicate blocked: ${granted.slug}"
                    return
                }
                log += "  ${item.slug} → ${granted.slug}"
                applyItem(granted, state, "${item.slug}→${granted.slug}", state.level, depth + 1)
            }

            is RuleElement.ActiveEffectLike -> {
                if (!checkPredicate(rule.predicate, state)) return
                val path = interpolate(rule.path, item.slug, state)
                if (path.contains("{")) {
                    log += "  ? ${item.slug} AEL unresolved path: ${rule.path}"
                    return
                }
                val value = resolveValue(rule.value, item.slug, state)
                state.mutate(path, rule.mode, value)
                log += "  ${item.slug} AEL ${rule.mode} $path = $value"
            }

            is RuleElement.MartialProficiency -> {
                // Definition is a Foundry predicate array used for weapon matching at
                // gameplay time. We store the string atoms (interpolated) for display;
                // compound objects ({"or":[...]}) are dropped — they describe category
                // restrictions (simple/martial/advanced) already implied by the rank grant.
                val def = rule.definition
                    .mapNotNull { (it as? JsonPrimitive)?.content }
                    .map { interpolate(it, item.slug, state) }
                state.martialProficiencies += MartialProficiency(def, Rank.fromValue(rule.value), rule.slug)
            }

            is RuleElement.Sense -> {
                if (!checkPredicate(rule.predicate, state)) return
                state.senses += Sense(
                    type = rule.selector,
                    acuity = rule.acuity,
                    range = (rule.range as? JsonPrimitive)?.intOrNull,
                )
            }

            is RuleElement.ActorTraits -> {
                state.traits += rule.add
                state.traits -= rule.remove.toSet()
            }

            is RuleElement.BaseSpeed -> {
                if (!checkPredicate(rule.predicate, state)) return
                val v = resolveValue(rule.value, item.slug, state)
                if (rule.selector == "land") state.set("system.attributes.speed.value", v)
                else state.set("system.attributes.speed.${rule.selector}", v)
            }

            is RuleElement.Resistance -> {
                if (!checkPredicate(rule.predicate, state)) return
                val v = resolveValue(rule.value, item.slug, state) as? Int ?: 0
                state.resistances += Resistance(rule.type, v)
            }

            is RuleElement.Unhandled -> {} // FlatModifier, RollOption, Note, DamageDice, etc. — gameplay-only
        }
    }

    // ─── Value resolution ─────────────────────────────────────────────────────

    /**
     * `JsonElement` → runtime value. Numbers pass through. Strings are
     * interpolated then, if they look like a formula, evaluated. Arrays and
     * objects pass through for list-append semantics in `add` mode.
     */
    private fun resolveValue(v: JsonElement, itemSlug: String, state: CharacterState): Any? = when (v) {
        is JsonPrimitive -> when {
            v is JsonNull -> null
            v.booleanOrNull != null -> v.booleanOrNull
            v.intOrNull != null -> v.intOrNull
            else -> {
                val s = interpolate(v.content, itemSlug, state)
                if (Formula.isFormula(s)) Formula.eval(s, state) else s
            }
        }
        else -> v // JsonArray / JsonObject — opaque, appended to lists
    }

    // ─── Template interpolation ───────────────────────────────────────────────

    /** `{item|flags.system.rulesSelections.X}` → item flag X; `{actor|PATH}` → state path. */
    private fun interpolate(s: String, itemSlug: String, state: CharacterState): String {
        if (!s.contains("{")) return s
        return TEMPLATE.replace(s) { m ->
            val (scope, path) = m.destructured
            when (scope) {
                "item" -> {
                    // path is "flags.system.rulesSelections.{flag}" — we only store by flag name
                    val flag = path.substringAfterLast('.')
                    state.itemFlag(itemSlug, flag)?.toString() ?: m.value
                }
                "actor" -> state.get(path)?.toString() ?: m.value
                else -> m.value
            }
        }
    }

    // ─── Foundry predicate DSL ────────────────────────────────────────────────
    //
    // Top-level array is an implicit AND. Atoms are roll-option strings;
    // compound forms are single-key objects: not, or, and, nor, gte, lte, gt, lt, eq.
    // Comparison atoms (self:level, skill:X:rank) are resolved by [comparisonValue].

    private fun checkPredicate(pred: JsonArray?, state: CharacterState): Boolean {
        if (pred == null) return true
        return pred.all { evalPred(it, state) }
    }

    private fun evalPred(p: JsonElement, state: CharacterState): Boolean = when (p) {
        is JsonPrimitive -> evalAtom(p.content, state)
        is JsonObject -> {
            val (op, arg) = p.entries.first()
            when (op) {
                "not"  -> !evalPred(arg, state)
                "or"   -> (arg as JsonArray).any { evalPred(it, state) }
                "and"  -> (arg as JsonArray).all { evalPred(it, state) }
                "nor"  -> (arg as JsonArray).none { evalPred(it, state) }
                "nand" -> !(arg as JsonArray).all { evalPred(it, state) }
                "gte"  -> cmpOp(arg as JsonArray, state) { a, b -> a >= b }
                "lte"  -> cmpOp(arg as JsonArray, state) { a, b -> a <= b }
                "gt"   -> cmpOp(arg as JsonArray, state) { a, b -> a > b }
                "lt"   -> cmpOp(arg as JsonArray, state) { a, b -> a < b }
                "eq"   -> cmpOp(arg as JsonArray, state) { a, b -> a == b }
                else   -> false
            }
        }
        else -> false
    }

    private fun cmpOp(args: JsonArray, state: CharacterState, f: (Int, Int) -> Boolean): Boolean {
        val a = comparisonValue(args[0], state)
        val b = comparisonValue(args[1], state)
        return f(a, b)
    }

    private fun comparisonValue(e: JsonElement, state: CharacterState): Int {
        (e as? JsonPrimitive)?.intOrNull?.let { return it }
        val path = (e as JsonPrimitive).content
        return when {
            path == "self:level" -> state.level
            path.startsWith("skill:") && path.endsWith(":rank") ->
                state.skillRank(path.removePrefix("skill:").removeSuffix(":rank")).value
            // item:level used in ChoiceSet filters, not here — but handle defensively
            else -> 0
        }
    }

    /**
     * String atoms test roll-option membership. A few prefixes are computed
     * rather than stored (armor:group, self:effect — gameplay-only).
     */
    private fun evalAtom(atom: String, state: CharacterState): Boolean = when {
        // Gameplay-time atoms — always false at build time
        atom.startsWith("armor:") -> false       // equipped armor
        atom.startsWith("self:effect:") -> false // active spell effects
        // Exact-rank atom: skill:athletics:rank:4
        atom.startsWith("skill:") && atom.count { it == ':' } == 3 -> {
            val parts = atom.split(":")
            state.skillRank(parts[1]).value == parts[3].toInt()
        }
        // Everything else: roll-option set membership.
        // Covers class:X, feat:X, feature:X, ancestry:X, heritage:X,
        // {itemSlug}:{choiceValue}, feat:{slug}:{choice}, and bare toggles.
        else -> atom in state.rollOptions
    }

    // ─── Utility ──────────────────────────────────────────────────────────────

    private fun GameItem.kind(): String = when (this) {
        is Feat -> "feat"
        is ClassFeature -> "feature"
        else -> javaClass.simpleName.lowercase()
    }

    companion object {
        /** `{scope|path}` — scope is `item` or `actor`. */
        private val TEMPLATE = Regex("""\{(item|actor)\|([^}]+)}""")
    }
}
