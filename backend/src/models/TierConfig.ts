import { Schema, model } from 'mongoose';
import { ITierConfigDocument } from '../types/index.js';

const tierRowSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da categoria do Tier é obrigatório'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Cor do Tier é obrigatória'],
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const tierConfigSchema = new Schema<ITierConfigDocument>(
  {
    rows: [tierRowSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const TierConfig = model<ITierConfigDocument>('TierConfig', tierConfigSchema);
