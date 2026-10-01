import { Schema, model } from 'mongoose';
import { IMovieDocument } from '../types/index.js';

const movieSchema = new Schema<IMovieDocument>(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'O título do filme é obrigatório'],
      trim: true,
      index: true,
    },
    originalTitle: {
      type: String,
      default: '',
      trim: true,
    },
    director: {
      type: String,
      default: 'Desconhecido',
      trim: true,
    },
    posterUrl: {
      type: String,
      default: '',
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: true,
    },
    genres: {
      type: [String],
      default: [],
    },
    runtime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index para buscas por título com insensitive case
movieSchema.index({ title: 'text', originalTitle: 'text' });

export const Movie = model<IMovieDocument>('Movie', movieSchema);
