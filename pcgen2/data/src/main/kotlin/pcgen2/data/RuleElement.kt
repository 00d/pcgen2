package pcgen2.data

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Foundry Rule Element — the declarative JSON rules engine that drives all
 * character-build mutations. Every game item carries a `rules[]` array.
 *
 * 26 types exist in Player Core data. For v1 (character creation + level-up,
 * no live sheet) we implement the 8 build-critical types and preserve the rest
 * as [Unhandled] no-ops.
 *
 * Dispatched on the `"key"` JSON field via [RuleElementSerializer].
 */
@Serializable(with = RuleElementSerializer::class)
sealed interface RuleElement {
    val key: String
    /** Foundry applies rules in priority order (default 100). */
    val priority: Int get() = 100

    // ========================================================================
    // CRITICAL — the choice→grant→modify chain
    // ========================================================================

    /**
     * Prompts the user to choose from a set of options, stores result in
     * item-local flags under [flag] for later interpolation.
     *
     * [choices] is polymorphic:
     *  - `JsonArray` of `{label, value}` — static options
     *  - `JsonObject` with `filter: [...], itemType: "feat"` — dynamic query
     *  - `JsonObject` with `config: "skills"` — named config reference
     *  - `JsonPrimitive` string — shorthand config ("weaponGroups")
     */
    data class ChoiceSet(
        val choices: JsonElement,
        val flag: String,
        val prompt: String? = null,
        val adjustName: Boolean = false,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "ChoiceSet"
    }

    /**
     * Grants another item (feat, feature, action) to the character.
     * [uuid] may contain template interpolation: `{item|flags.system.rulesSelections.X}`
     * which resolves to a prior [ChoiceSet] selection.
     */
    data class GrantItem(
        val uuid: String,
        val allowDuplicate: Boolean = true,
        val flag: String? = null,
        val predicate: JsonArray? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "GrantItem"
    }

    /**
     * Mutates a path on the character state.
     * [path] may contain templates. [value] may be a number, a literal string,
     * a formula string (e.g. `"ternary(gte(@actor.level,5),2,1)"`), or a
     * complex object (appended to lists when mode=add).
     */
    data class ActiveEffectLike(
        val path: String,
        val mode: Mode,
        val value: JsonElement,
        val predicate: JsonArray? = null,
        val phase: String? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "ActiveEffectLike"
        enum class Mode {
            /** max(current, value) — primary mode for proficiency ranks */
            upgrade,
            /** current + value, or list append */
            add,
            /** set to value */
            override,
            /** min(current, value) */
            downgrade,
            /** current - value */
            subtract,
        }
    }

    // ========================================================================
    // IMPORTANT — build-relevant state
    // ========================================================================

    /**
     * Grants weapon proficiency matching [definition] predicates.
     * Used by features like Fighter Weapon Mastery / Weapon Legend.
     */
    data class MartialProficiency(
        val definition: JsonArray,
        val value: Int,
        val slug: String? = null,
        val label: String? = null,
        val sameAs: String? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "MartialProficiency"
    }

    /** Grants a sense (darkvision, scent, etc.). */
    data class Sense(
        val selector: String,
        val acuity: String? = null,
        val range: JsonElement? = null,
        val predicate: JsonArray? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "Sense"
    }

    /** Adds/removes actor-level traits (beast, humanoid, etc.). */
    data class ActorTraits(
        val add: List<String> = emptyList(),
        val remove: List<String> = emptyList(),
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "ActorTraits"
    }

    /** Overrides or adds a movement speed type. */
    data class BaseSpeed(
        val selector: String,
        val value: JsonElement,
        val predicate: JsonArray? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "BaseSpeed"
    }

    /** Grants damage resistance. */
    data class Resistance(
        val type: String,
        val value: JsonElement,
        val predicate: JsonArray? = null,
        override val priority: Int = 100,
    ) : RuleElement {
        override val key = "Resistance"
    }

    // ========================================================================
    // CATCH-ALL
    // ========================================================================

    /**
     * Any rule type not modeled above. Preserved for round-tripping and
     * future expansion, no-op in the v1 engine.
     *
     * Includes gameplay-only rules that don't affect build validity:
     * FlatModifier, RollOption, Note, AdjustDegreeOfSuccess, DamageDice,
     * Strike, CriticalSpecialization, ItemAlteration, AdjustModifier,
     * AdjustStrike, MultipleAttackPenalty, EphemeralEffect, DamageAlteration,
     * SubstituteRoll, Aura, TokenLight, TokenEffectIcon, CraftingAbility.
     */
    data class Unhandled(
        override val key: String,
        val raw: JsonObject,
        override val priority: Int = 100,
    ) : RuleElement
}

/**
 * Dispatches on the `"key"` field. Unknown keys deserialize to [RuleElement.Unhandled]
 * rather than throwing — forward-compat with Foundry data updates.
 */
object RuleElementSerializer : KSerializer<RuleElement> {
    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("RuleElement")

    override fun deserialize(decoder: Decoder): RuleElement {
        val input = decoder as? JsonDecoder ?: error("RuleElement only supports JSON")
        val obj = input.decodeJsonElement().jsonObject
        val key = obj["key"]?.jsonPrimitive?.content ?: error("rule missing key: $obj")
        val priority = obj["priority"]?.jsonPrimitive?.intOrNull ?: 100

        return when (key) {
            "ChoiceSet" -> RuleElement.ChoiceSet(
                choices = obj["choices"] ?: JsonArray(emptyList()),
                flag = obj["flag"]?.jsonPrimitive?.content ?: "choice",
                prompt = obj["prompt"]?.jsonPrimitive?.content,
                adjustName = obj["adjustName"]?.jsonPrimitive?.content?.toBoolean() ?: false,
                priority = priority,
            )
            "GrantItem" -> RuleElement.GrantItem(
                uuid = obj["uuid"]?.jsonPrimitive?.content ?: "",
                allowDuplicate = obj["allowDuplicate"]?.jsonPrimitive?.content?.toBoolean() ?: true,
                flag = obj["flag"]?.jsonPrimitive?.content,
                predicate = obj["predicate"] as? JsonArray,
                priority = priority,
            )
            "ActiveEffectLike" -> RuleElement.ActiveEffectLike(
                path = obj["path"]?.jsonPrimitive?.content ?: error("ActiveEffectLike missing path"),
                mode = RuleElement.ActiveEffectLike.Mode.valueOf(obj["mode"]?.jsonPrimitive?.content ?: "override"),
                value = obj["value"] ?: JsonPrimitive(0),
                predicate = obj["predicate"] as? JsonArray,
                phase = obj["phase"]?.jsonPrimitive?.content,
                priority = priority,
            )
            "MartialProficiency" -> RuleElement.MartialProficiency(
                definition = obj["definition"]?.jsonArray ?: JsonArray(emptyList()),
                value = obj["value"]?.jsonPrimitive?.int ?: 0,
                slug = obj["slug"]?.jsonPrimitive?.content,
                label = obj["label"]?.jsonPrimitive?.content,
                sameAs = obj["sameAs"]?.jsonPrimitive?.content,
                priority = priority,
            )
            "Sense" -> RuleElement.Sense(
                selector = obj["selector"]?.jsonPrimitive?.content ?: "",
                acuity = obj["acuity"]?.jsonPrimitive?.content,
                range = obj["range"],
                predicate = obj["predicate"] as? JsonArray,
                priority = priority,
            )
            "ActorTraits" -> RuleElement.ActorTraits(
                add = obj["add"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList(),
                remove = obj["remove"]?.jsonArray?.map { it.jsonPrimitive.content } ?: emptyList(),
                priority = priority,
            )
            "BaseSpeed" -> RuleElement.BaseSpeed(
                selector = obj["selector"]?.jsonPrimitive?.content ?: "land",
                value = obj["value"] ?: JsonPrimitive(0),
                predicate = obj["predicate"] as? JsonArray,
                priority = priority,
            )
            "Resistance" -> RuleElement.Resistance(
                type = obj["type"]?.jsonPrimitive?.content ?: "",
                value = obj["value"] ?: JsonPrimitive(0),
                predicate = obj["predicate"] as? JsonArray,
                priority = priority,
            )
            else -> RuleElement.Unhandled(key, obj, priority)
        }
    }

    override fun serialize(encoder: Encoder, value: RuleElement) {
        val output = encoder as? JsonEncoder ?: error("RuleElement only supports JSON")
        val obj = when (value) {
            is RuleElement.ChoiceSet -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("choices", value.choices)
                put("flag", JsonPrimitive(value.flag))
                value.prompt?.let { put("prompt", JsonPrimitive(it)) }
                if (value.adjustName) put("adjustName", JsonPrimitive(true))
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.GrantItem -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("uuid", JsonPrimitive(value.uuid))
                if (!value.allowDuplicate) put("allowDuplicate", JsonPrimitive(false))
                value.flag?.let { put("flag", JsonPrimitive(it)) }
                value.predicate?.let { put("predicate", it) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.ActiveEffectLike -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("path", JsonPrimitive(value.path))
                put("mode", JsonPrimitive(value.mode.name))
                put("value", value.value)
                value.predicate?.let { put("predicate", it) }
                value.phase?.let { put("phase", JsonPrimitive(it)) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.MartialProficiency -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("definition", value.definition)
                put("value", JsonPrimitive(value.value))
                value.slug?.let { put("slug", JsonPrimitive(it)) }
                value.label?.let { put("label", JsonPrimitive(it)) }
                value.sameAs?.let { put("sameAs", JsonPrimitive(it)) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.Sense -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("selector", JsonPrimitive(value.selector))
                value.acuity?.let { put("acuity", JsonPrimitive(it)) }
                value.range?.let { put("range", it) }
                value.predicate?.let { put("predicate", it) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.ActorTraits -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                if (value.add.isNotEmpty()) put("add", JsonArray(value.add.map { JsonPrimitive(it) }))
                if (value.remove.isNotEmpty()) put("remove", JsonArray(value.remove.map { JsonPrimitive(it) }))
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.BaseSpeed -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("selector", JsonPrimitive(value.selector))
                put("value", value.value)
                value.predicate?.let { put("predicate", it) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.Resistance -> buildJsonObject {
                put("key", JsonPrimitive(value.key))
                put("type", JsonPrimitive(value.type))
                put("value", value.value)
                value.predicate?.let { put("predicate", it) }
                if (value.priority != 100) put("priority", JsonPrimitive(value.priority))
            }
            is RuleElement.Unhandled -> value.raw
        }
        output.encodeJsonElement(obj)
    }
}
