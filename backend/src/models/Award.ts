import { Schema, model } from 'mongoose';
import { IAwardDocument } from '../types/index.js';

const awardSchema = new Schema<IAwardDocument>(
  {
    year: {
      type: Number,
      required: [true, 'O ano da premiação é obrigatório'],
      index: true,
    },
    categoryName: {
      type: String,
      required: [true, 'O nome da categoria do Oscar é obrigatório'],
      trim: true,
    },
    nominees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
      },
    ],
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'A sessão vencedora é obrigatória'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice composto para buscar categorias de um determinado ano
awardSchema.index({ year: -1, categoryName: 1 });

export const Award = model<IAwardDocument>('Award', awardSchema);
