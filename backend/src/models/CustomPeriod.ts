import { Schema, model } from 'mongoose';
import { ICustomPeriodDocument } from '../types/index.js';

const customPeriodSchema = new Schema<ICustomPeriodDocument>(
  {
    name: {
      type: String,
      required: [true, 'O nome do período é obrigatório'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'O ano do período é obrigatório'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'A data inicial é obrigatória'],
    },
    endDate: {
      type: Date,
      required: [true, 'A data final é obrigatória'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

customPeriodSchema.index({ year: -1, startDate: 1 });

export const CustomPeriod = model<ICustomPeriodDocument>('CustomPeriod', customPeriodSchema);
