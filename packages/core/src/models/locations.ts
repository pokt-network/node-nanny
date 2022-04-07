import { Schema, model, Model, Types } from "mongoose";

export interface ILocation {
  id: Types.ObjectId;
  name: ELocation;
}

export enum ELocation {
  NL = "NL",
  LI = "LI",
  DE = "DE",
  USE1 = "USE1",
  USE2 = "USE2",
  USW2 = "USW2",
  HK = "HK",
  LDN = "LDN",
  SG = "SG",
  APSE1 = "APSE1",
  APNE1 = "APNE1",
  CACE1 = "CACE1",
  EUCE1 = "EUCE1",
}

export const locationSchema = new Schema<ILocation>(
  {
    name: { type: String, unique: true, required: true, enum: Object.values(ELocation) },
  },
  { timestamps: true },
);
export const LocationsModel: Model<ILocation> = model("Locations", locationSchema);
