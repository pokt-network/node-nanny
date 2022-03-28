import { Schema, model, Model, Types } from "mongoose";

import { ILocation } from "./locations";

export interface IHost<Populated = true> {
  id: Types.ObjectId;
  name: string;
  loadBalancer: boolean;
  location: Populated extends true ? ILocation : Types.ObjectId;
  ip?: string;
  fqdn?: string;
}

export const hostsSchema = new Schema<IHost>(
  {
    name: { type: String, unique: true, required: true },
    loadBalancer: { type: Boolean, required: true },
    location: { type: Schema.Types.ObjectId, ref: "Locations", required: true },
    ip: { type: String, unique: true, sparse: true },
    fqdn: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("Hosts", hostsSchema);
