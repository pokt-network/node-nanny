import { Schema, model, Model, Types } from 'mongoose';

export interface ILocation {
  id: Types.ObjectId;
  name: string;
}

export const locationsSchema = new Schema<ILocation>(
  {
    name: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);
export const LocationsModel: Model<ILocation> = model('Locations', locationsSchema);
