import { Schema, model, Model } from "mongoose";

export interface ILocation {
  id: Schema.Types.ObjectId;
  name: string;
}

export const locationSchema = new Schema<ILocation>(
  {
    id: Schema.Types.ObjectId,
    name: { type: String, unique: true, required: true },
  },
  { timestamps: true },
);

export const LocationsModel: Model<ILocation> = model("locations", locationSchema);
