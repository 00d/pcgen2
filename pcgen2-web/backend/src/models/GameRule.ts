import mongoose, { Schema, Document } from 'mongoose';
import { GameRule as GameRuleType, GameRuleType as RuleType } from '../types/gameRules';

export interface IGameRule extends Document, GameRuleType {}

const gameRuleSchema = new Schema<IGameRule>(
  {
    type: {
      type: String,
      enum: ['race', 'class', 'feat', 'spell', 'equipment', 'ability'],
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
    },
    data: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Create compound index for uniqueness within type
gameRuleSchema.index({ type: 1, id: 1 }, { unique: true });

export const GameRule = mongoose.model<IGameRule>('GameRule', gameRuleSchema);
