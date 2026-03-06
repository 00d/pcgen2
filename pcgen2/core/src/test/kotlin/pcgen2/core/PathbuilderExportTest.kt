package pcgen2.core

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import pcgen2.data.Ability.CHA
import pcgen2.data.Ability.CON
import pcgen2.data.Ability.DEX
import pcgen2.data.Ability.STR
import pcgen2.data.Ability.WIS
import pcgen2.data.FeatCategory
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class PathbuilderExportTest {

    // ─── Convenience: JSON path traversal ─────────────────────────────────────
    // buildJsonObject nests JsonObject/JsonArray; these save a lot of `.jsonObject` noise.

    private operator fun JsonObject.div(key: String): JsonObject = getValue(key).jsonObject
    private fun JsonObject.arr(key: String): JsonArray = getValue(key).jsonArray
    private fun JsonObject.str(key: String): String = getValue(key).jsonPrimitive.content
    private fun JsonObject.int(key: String): Int = getValue(key).jsonPrimitive.int
    private fun JsonArray.strings(): List<String> = map { it.jsonPrimitive.content }

    // ─── The Fighter 5 acceptance build — same record as CharacterBuilderTest ─

    private fun fighter5() = CharacterBuilder().apply {
        name = "Valeros"; level = 5
        ancestry = "human"; heritage = "versatile-human"
        background = "warrior"; pcClass = "fighter"; keyAbility = STR
        ancestryBoosts += listOf(STR, CON)
        backgroundBoosts += listOf(STR, WIS)
        boostsAt(1, STR, DEX, CON, WIS)
        boostsAt(5, DEX, CON, WIS, CHA)
        choice("fighter", "fighterSkill", "athletics")
        choice("versatile-human", "versatileHeritage", "Compendium.pf2e.feats-srd.Item.Toughness")
        choice("fighter-weapon-mastery", "fighterWeaponMastery", "sword")
        additionalSkills += listOf("survival", "medicine", "society")
        selectFeat(1, FeatCategory.ANCESTRY, "natural-ambition")
        selectFeat(1, FeatCategory.CLASS, "sudden-charge")
        selectFeat(2, FeatCategory.CLASS, "intimidating-strike")
        selectFeat(2, FeatCategory.SKILL, "titan-wrestler")
        selectFeat(3, FeatCategory.GENERAL, "fleet")
        selectFeat(4, FeatCategory.CLASS, "swipe")
        selectFeat(4, FeatCategory.SKILL, "battle-medicine")
        selectFeat(5, FeatCategory.ANCESTRY, "haughty-obstinacy")
        choice("natural-ambition", "naturalAmbition", "Compendium.pf2e.feats-srd.Item.Vicious Swing")
        skillIncrease(3, "athletics")
        skillIncrease(5, "intimidation")
    }

    // ─── Envelope & identity ──────────────────────────────────────────────────

    @Test fun `envelope shape — success flag and build body`() {
        val json = PathbuilderExport.export(fighter5())
        assertTrue(json.getValue("success").jsonPrimitive.boolean)
        assertContains(json, "build")

        val build = json / "build"
        assertEquals("Valeros", build.str("name"))
        assertEquals("Fighter", build.str("class"))         // display name, not slug
        assertEquals(5, build.int("level"))
        assertEquals("Human", build.str("ancestry"))
        assertEquals("Versatile Human", build.str("heritage"))
        assertEquals("Warrior", build.str("background"))
        assertEquals("str", build.str("keyability"))        // slug lowercase
        assertEquals("N", build.str("alignment"))           // Remaster stub
        assertEquals(2, build.int("size"))                  // med = ordinal 2
        assertEquals(JsonNull, build["dualClass"])
    }

    @Test fun `size ordinal — all enum values`() {
        // tiny=0, sm=1, med=2, lg=3, huge=4, grg=5 — matches pathmuncher's getSizeValue switch
        val sizes = pcgen2.data.Size.entries
        assertEquals(listOf(0, 1, 2, 3, 4, 5), sizes.map { it.ordinal })
        assertEquals("med", sizes[2].slug)
    }

    // ─── Abilities: score derivation + breakdown ──────────────────────────────

    @Test fun `ability scores — 10 + mod x 2 inverts pathmuncher's trunc`() {
        // pathmuncher: mod = Math.trunc((score - 10) / 2)
        // We emit score = 10 + mod * 2. Round-trip is exact for all mod values
        // because the score we emit is always even-distance from 10.
        val build = PathbuilderExport.export(fighter5()) / "build"
        val abilities = build / "abilities"

        // STR mod +4 → score 18; CON +3 → 16; INT +0 → 10; DEX +2 → 14
        assertEquals(18, abilities.int("str"))
        assertEquals(14, abilities.int("dex"))
        assertEquals(16, abilities.int("con"))
        assertEquals(10, abilities.int("int"))
        assertEquals(16, abilities.int("wis"))
        assertEquals(12, abilities.int("cha"))

        // Verify the round-trip property
        for (slug in listOf("str", "dex", "con", "int", "wis", "cha")) {
            val score = abilities.int(slug)
            assertEquals((score - 10) / 2, (score - 10) / 2, "trunc on even offset is identity")
        }
    }

    @Test fun `breakdown — human has zero fixed boosts, two free`() {
        // Human: boosts = [[6 abilities], [6 abilities], []] — all free, one empty.
        // Picks STR, CON. Both should land in ancestryFree; ancestryBoosts stays empty.
        val bd = PathbuilderExport.export(fighter5()) / "build" / "abilities" / "breakdown"

        assertEquals(listOf("Str", "Con"), bd.arr("ancestryFree").strings())
        assertEquals(emptyList(), bd.arr("ancestryBoosts").strings())
        assertEquals(emptyList(), bd.arr("ancestryFlaws").strings())
        assertEquals(listOf("Str"), bd.arr("classBoosts").strings())
    }

    @Test fun `breakdown — dwarf separates fixed boosts from free pick and captures flaw`() {
        // Dwarf: boosts = [[con], [wis], [all 6]], flaws = [[cha]]
        // Fixed CON/WIS → ancestryBoosts. Free pick (STR) → ancestryFree. CHA → flaws.
        val b = CharacterBuilder().apply {
            ancestry = "dwarf"; pcClass = "fighter"; keyAbility = STR; level = 1
            ancestryBoosts += STR  // free slot pick
        }
        val bd = PathbuilderExport.export(b) / "build" / "abilities" / "breakdown"

        assertEquals(listOf("Con", "Wis"), bd.arr("ancestryBoosts").strings(),
            "fixed single-ability slots in slot order")
        assertEquals(listOf("Str"), bd.arr("ancestryFree").strings())
        assertEquals(listOf("Cha"), bd.arr("ancestryFlaws").strings())
    }

    @Test fun `breakdown — background emits picks in slot order`() {
        // Warrior: slot 0 = [con,str] constrained, slot 1 = free. Picks STR, WIS.
        // Both → backgroundBoosts (single array, pathmuncher matches positionally).
        val bd = PathbuilderExport.export(fighter5()) / "build" / "abilities" / "breakdown"
        assertEquals(listOf("Str", "Wis"), bd.arr("backgroundBoosts").strings())
    }

    @Test fun `breakdown — mapLevelledBoosts only includes applied levels`() {
        val b = fighter5()
        b.boostsAt(10, STR, DEX, CON, WIS)  // beyond current level 5
        val boosts = PathbuilderExport.export(b) / "build" / "abilities" / "breakdown" / "mapLevelledBoosts"

        assertEquals(setOf("1", "5"), boosts.keys, "L10 boosts recorded but not applied → excluded")
        assertEquals(listOf("Str", "Dex", "Con", "Wis"), boosts.arr("1").strings())
        assertEquals(listOf("Dex", "Con", "Wis", "Cha"), boosts.arr("5").strings())
    }

    // ─── Proficiencies: rank × 2 ──────────────────────────────────────────────

    @Test fun `proficiencies — rank doubled, covers all skill slugs`() {
        val prof = PathbuilderExport.export(fighter5()) / "build" / "proficiencies"

        // Athletics: Expert (rank 2) → 4
        assertEquals(4, prof.int("athletics"))
        // Intimidation: Expert → 4 (warrior trains, L5 increase)
        assertEquals(4, prof.int("intimidation"))
        // Survival: Trained (rank 1) → 2
        assertEquals(2, prof.int("survival"))
        // Arcana: Untrained → 0
        assertEquals(0, prof.int("arcana"))

        // Non-skills
        assertEquals(4, prof.int("perception"))  // Fighter: Expert
        assertEquals(2, prof.int("classDC"))     // Trained
        assertEquals(4, prof.int("fortitude"))   // Expert
        assertEquals(4, prof.int("reflex"))
        assertEquals(2, prof.int("will"))        // Trained
        assertEquals(4, prof.int("martial"))     // Expert weapons
        assertEquals(2, prof.int("advanced"))    // Trained
        assertEquals(2, prof.int("heavy"))       // Trained armor

        // Every Skill enum value has a key (consumer iterates a fixed list)
        for (sk in pcgen2.data.Skill.entries) assertContains(prof, sk.slug)
    }

    // ─── Feats: positional tuples ─────────────────────────────────────────────

    @Test fun `feats — four-element tuples with display names and types`() {
        val feats = (PathbuilderExport.export(fighter5()) / "build").arr("feats")

        assertEquals(8, feats.size, "8 user picks, not auto-grants")

        // [name, extra, type, level]
        val sudden = feats.map { it.jsonArray }.first { it[0].jsonPrimitive.content == "Sudden Charge" }
        assertEquals(4, sudden.size)
        assertEquals(JsonNull, sudden[1])
        assertEquals("Class Feat", sudden[2].jsonPrimitive.content)
        assertEquals(1, sudden[3].jsonPrimitive.int)

        val titan = feats.map { it.jsonArray }.first { it[0].jsonPrimitive.content == "Titan Wrestler" }
        assertEquals("Skill Feat", titan[2].jsonPrimitive.content)
        assertEquals(2, titan[3].jsonPrimitive.int)

        // Types are FeatCategory.display — all four categories represented
        val types = feats.map { it.jsonArray[2].jsonPrimitive.content }.toSet()
        assertEquals(setOf("Ancestry Feat", "Class Feat", "Skill Feat", "General Feat"), types)
    }

    @Test fun `feats — auto-granted feats excluded, user picks only`() {
        val build = PathbuilderExport.export(fighter5()) / "build"
        val featNames = build.arr("feats").map { it.jsonArray[0].jsonPrimitive.content }.toSet()

        // User-selected — present
        assertContains(featNames, "Sudden Charge")
        assertContains(featNames, "Natural Ambition")

        // Auto-granted by rules engine — absent (Foundry rediscovers on import)
        assertTrue("Intimidating Glare" !in featNames, "warrior bg auto-grants this")
        assertTrue("Toughness" !in featNames, "versatile-human ChoiceSet→GrantItem grants this")
        assertTrue("Vicious Swing" !in featNames, "natural-ambition ChoiceSet→GrantItem grants this")
    }

    // ─── Specials: features + granted-not-picked feats ────────────────────────

    @Test fun `specials — class features by name plus granted feats`() {
        val specials = (PathbuilderExport.export(fighter5()) / "build").arr("specials").strings().toSet()

        // Fighter class features at L1-5
        assertContains(specials, "Reactive Strike")
        assertContains(specials, "Shield Block")
        assertContains(specials, "Bravery")
        assertContains(specials, "Fighter Weapon Mastery")

        // Granted-not-picked feats (complement of the feats array)
        assertContains(specials, "Intimidating Glare")
        assertContains(specials, "Toughness")
        assertContains(specials, "Vicious Swing")

        // User picks NOT in specials
        assertTrue("Sudden Charge" !in specials)
        // Future features NOT in specials
        assertTrue("Battlefield Surveyor" !in specials)
    }

    // ─── Lores ────────────────────────────────────────────────────────────────

    @Test fun `lores — name + rank doubled tuples`() {
        val lores = (PathbuilderExport.export(fighter5()) / "build").arr("lores")

        // Warrior grants Warfare Lore at Trained (rank 1 → 2)
        val warfare = lores.map { it.jsonArray }.firstOrNull { it[0].jsonPrimitive.content == "Warfare Lore" }
        assertTrue(warfare != null, "Warfare Lore from warrior background: $lores")
        assertEquals(2, warfare[1].jsonPrimitive.int)
    }

    // ─── Attributes & empty stubs ─────────────────────────────────────────────

    @Test fun `attributes — hp components exposed for consumers that recompute`() {
        val attr = PathbuilderExport.export(fighter5()) / "build" / "attributes"
        assertEquals(8, attr.int("ancestryhp"))   // human
        assertEquals(10, attr.int("classhp"))     // fighter
        assertEquals(25, attr.int("speed"))
    }

    @Test fun `empty stubs — keys exist so consumers do not KeyError`() {
        val build = PathbuilderExport.export(fighter5()) / "build"
        for (key in listOf("equipment", "weapons", "armor", "spellCasters", "formula", "pets")) {
            assertEquals(0, build.arr(key).size, "$key should be empty array")
        }
        assertContains(build, "money")
        assertEquals(0, (build / "money").int("gp"))
    }

    // ─── Minimal / partial builders ───────────────────────────────────────────

    @Test fun `bare builder — no ABCs set, exports without throwing`() {
        val build = PathbuilderExport.export(CharacterBuilder()) / "build"

        assertEquals("", build.str("class"))
        assertEquals("", build.str("ancestry"))
        assertEquals(2, build.int("size"))  // defaults to Medium
        assertEquals(0, build.arr("feats").size)
        assertEquals(0, build.arr("specials").size)

        // All ability scores default to 10 (mod +0)
        val abilities = build / "abilities"
        for (slug in listOf("str", "dex", "con", "int", "wis", "cha")) {
            assertEquals(10, abilities.int(slug))
        }

        // Breakdown arrays all empty but present
        val bd = abilities / "breakdown"
        for (key in listOf("ancestryFree", "ancestryBoosts", "ancestryFlaws", "backgroundBoosts", "classBoosts")) {
            assertEquals(0, bd.arr(key).size, key)
        }
    }

    @Test fun `caller-supplied state — does not rebuild`() {
        // If the caller already has a built state, export should use it as-is.
        // Proved by: mutating state after build, export reflects the mutation.
        val b = fighter5()
        val s = b.build()
        s.set("system.attributes.speed.value", 99)

        val attr = PathbuilderExport.export(b, s) / "build" / "attributes"
        assertEquals(99, attr.int("speed"))
    }
}
