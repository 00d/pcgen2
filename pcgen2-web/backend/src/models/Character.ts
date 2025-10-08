import mongoose, { Schema, Document } from 'mongoose';
import { Character as CharacterType } from '../types/character';

export interface ICharacter extends Document, CharacterType {}

const abilityScoreSchema = new Schema(
  {
    base: { type: Number, default: 10 },
    racial: { type: Number, default: 0 },
    items: { type: Number, default: 0 },
    enhancement: { type: Number, default: 0 },
    total: { type: Number, default: 10 },
  },
  { _id: false }
);

const multiclassSchema = new Schema(
  {
    classId: { type: String, required: true },
    className: { type: String, required: true },
    level: { type: Number, required: true, min: 1 },
    hitDie: String,
    baseAttackBonusProgression: String,
    classAbilities: [
      {
        id: String,
        name: String,
        level: Number,
        description: String,
      },
    ],
  },
  { _id: false }
);

const characterSchema = new Schema<ICharacter>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    campaign: {
      type: String,
      required: true,
      default: 'Pathfinder 1e',
    },
    attributes: {
      race: {
        id: String,
        name: String,
        size: String,
        baseAbilityModifiers: mongoose.Schema.Types.Mixed,
        baseSpeed: Number,
        languages: [String],
        traits: [
          {
            id: String,
            name: String,
            description: String,
          },
        ],
      },
      classes: [multiclassSchema],
      abilityScores: {
        str: abilityScoreSchema,
        dex: abilityScoreSchema,
        con: abilityScoreSchema,
        int: abilityScoreSchema,
        wis: abilityScoreSchema,
        cha: abilityScoreSchema,
      },
    },
    derivedStats: {
      totalLevel: { type: Number, default: 1 }, // Phase 4: Sum of all class levels
      hitPoints: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        perClass: mongoose.Schema.Types.Mixed, // Phase 4: HP breakdown by class
      },
      armorClass: {
        base: { type: Number, default: 10 },
        dexBonus: { type: Number, default: 0 },
        armorBonus: { type: Number, default: 0 },
        shieldBonus: { type: Number, default: 0 },
        deflectionBonus: { type: Number, default: 0 },
        naturalArmor: { type: Number, default: 0 },
        total: { type: Number, default: 10 },
      },
      baseAttackBonus: { type: Number, default: 0 },
      baseAttackBonusByClass: mongoose.Schema.Types.Mixed, // Phase 4: BAB per class
      combatManeuverBonus: { type: Number, default: 0 },
      combatManeuverDefense: { type: Number, default: 10 },
      initiative: { type: Number, default: 0 },
      savingThrows: {
        fortitude: { type: Number, default: 0 },
        reflex: { type: Number, default: 0 },
        will: { type: Number, default: 0 },
      },
      savingThrowsByClass: mongoose.Schema.Types.Mixed, // Phase 4: Saves per class
      skillPoints: {
        remaining: { type: Number, default: 0 },
        used: { type: Number, default: 0 },
      },
    },
    feats: [
      {
        id: String,
        name: String,
        type: String,
        prerequisites: [String],
        benefit: String,
        special: String,
      },
    ],
    skills: [
      {
        name: String,
        ability: String,
        ranks: Number,
        classSkill: Boolean,
        bonus: {
          ranks: Number,
          abilityModifier: Number,
          armorPenalty: Number,
          misc: Number,
          total: Number,
        },
      },
    ],
    equipment: [
      {
        id: String,
        name: String,
        type: String,
        cost: String,
        weight: Number,
        equipped: Boolean,
        quantity: Number,
        description: String,
      },
    ],
    spells: {
      spellcaster: { type: Boolean, default: false },
      // Legacy single-class support
      spellcastingClass: String,
      spellcastingAbility: String,
      // Multiclass spell tracking: separate spells per class
      spellsByClass: [
        {
          classId: String, // 'wizard', 'cleric', 'sorcerer', etc.
          className: String,
          spellcastingAbility: String, // 'int', 'wis', 'cha'
          spellsKnown: [
            {
              id: String,
              name: String,
              level: Number,
              school: String,
              description: String,
            },
          ],
          spellSlots: [
            {
              level: Number,
              total: Number,
              used: Number,
            },
          ],
        },
      ],
      // Legacy flat spell lists (for backward compatibility)
      spellsKnown: [
        {
          id: String,
          name: String,
          level: Number,
          description: String,
        },
      ],
      spellSlots: [
        {
          level: Number,
          perDay: Number,
          used: Number,
        },
      ],
    },
    notes: { type: String, default: '' },
    description: { type: String, default: '' },
    alignment: { type: String, default: 'Neutral' },
    deity: { type: String, default: '' },
    imageUrl: String,
  },
  { timestamps: true }
);

export const Character = mongoose.model<ICharacter>('Character', characterSchema);
