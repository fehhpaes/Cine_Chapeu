import { Schema, model } from 'mongoose';
import { IOscarCeremonyDocument } from '../types/index.js';

const oscarCeremonySchema = new Schema<IOscarCeremonyDocument>(
  {
    year: {
      type: Number,
      required: [true, 'O ano da cerimônia é obrigatório'],
      unique: true,
      index: true,
    },
    votingStartDate: {
      type: Date,
      required: [true, 'A data inicial de votação é obrigatória'],
    },
    votingEndDate: {
      type: Date,
      required: [true, 'A data final de votação é obrigatória'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OscarCeremony = model<IOscarCeremonyDocument>('OscarCeremony', oscarCeremonySchema);
