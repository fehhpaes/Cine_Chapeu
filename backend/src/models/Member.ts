import { Schema, model } from 'mongoose';
import { IMemberDocument } from '../types/index.js';

const memberSchema = new Schema<IMemberDocument>(
  {
    name: {
      type: String,
      required: [true, 'O nome do membro é obrigatório'],
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const Member = model<IMemberDocument>('Member', memberSchema);
