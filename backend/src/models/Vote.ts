import { Schema, model } from 'mongoose';
import { IVoteDocument } from '../types/index.js';

const voteSelectionSchema = new Schema(
  {
    awardId: {
      type: Schema.Types.ObjectId,
      ref: 'Award',
      required: [true, 'awardId é obrigatório'],
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'sessionId é obrigatório'],
    },
  },
  { _id: false }
);

const voteSchema = new Schema<IVoteDocument>(
  {
    year: {
      type: Number,
      required: [true, 'O ano do Oscar é obrigatório'],
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'O membro votante é obrigatório'],
      index: true,
    },
    selections: {
      type: [voteSelectionSchema],
      required: [true, 'As seleções de voto são obrigatórias'],
      default: [],
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Garante que cada membro só pode registrar um voto por ano do Oscar
voteSchema.index({ year: 1, memberId: 1 }, { unique: true });

export const Vote = model<IVoteDocument>('Vote', voteSchema);
