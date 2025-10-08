import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  name: string;
  description?: string;
  setting?: string; // 'Pathfinder 1e', 'Golarion', 'Forgotten Realms', custom
  dungeon_master?: string;
  characters: mongoose.Schema.Types.ObjectId[]; // Reference to Character documents
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
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
    description: {
      type: String,
      default: '',
    },
    setting: {
      type: String,
      default: 'Pathfinder 1e',
    },
    dungeon_master: {
      type: String,
      default: '',
    },
    characters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Character',
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast queries
campaignSchema.index({ userId: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', campaignSchema);
