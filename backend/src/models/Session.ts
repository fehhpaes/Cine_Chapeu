import { Schema, model } from 'mongoose';
import { ISessionDocument } from '../types/index.js';

const sessionSchema = new Schema<ISessionDocument>(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'O filme da sessão é obrigatório'],
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'O membro responsável pela sessão é obrigatório'],
      index: true,
    },
    drawnCategory: {
      type: String,
      required: [true, 'A categoria sorteada é obrigatória'],
      trim: true,
      index: true,
    },
    exhibitionDate: {
      type: Date,
      required: [true, 'A data de exibição é obrigatória'],
      index: true,
    },
    notes: {
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

// Índice composto para queries de ordenação cronológica
sessionSchema.index({ exhibitionDate: -1 });

export const Session = model<ISessionDocument>('Session', sessionSchema);
