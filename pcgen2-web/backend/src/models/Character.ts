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
      classes: [
        {
          id: String,
          name: String,
          level: Number,
          hitDie: String,
          baseAttackBonusProgression: String,
          savingThrowBonus: {
            fort: Number,
            ref: Number,
            will: Number,
          },
          baseSkillsPerLevel: Number,
          classAbilities: [
            {
              id: String,
              name: String,
              level: Number,
              description: String,
            },
          ],
        },
      ],
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
      hitPoints: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
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
      combatManeuverBonus: { type: Number, default: 0 },
      combatManeuverDefense: { type: Number, default: 10 },
      initiative: { type: Number, default: 0 },
      savingThrows: {
        fortitude: { type: Number, default: 0 },
        reflex: { type: Number, default: 0 },
        will: { type: Number, default: 0 },
      },
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
      spellcastingClass: String,
      spellcastingAbility: String,
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
