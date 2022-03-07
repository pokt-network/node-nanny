import { Schema, model, Model, Types } from "mongoose";

import { ILocation } from "./locations";

export interface IHost<Populated = true> {
  id: Types.ObjectId;
  name: string;
  loadBalancer: boolean;
  location: Populated extends true ? ILocation : Types.ObjectId;
  ip?: string;
  fqdn?: string;

  //Old Types
  hostType: string;
  internalIpaddress?: string;
  internalHostName?: string;
  externalHostName?: string;
  awsInstanceId?: string;
}

export const hostsSchema = new Schema<IHost>(
  {
    name: { type: String, unique: true, required: true },
    loadBalancer: { type: Boolean, required: true },
    location: { type: Schema.Types.ObjectId, ref: "locations", required: true },
    ip: { type: String, unique: true, sparse: true },
    fqdn: { type: String, unique: true, sparse: true },

    //Old Types
    hostType: String,
    internalIpaddress: String,
    internalHostName: String,
    externalHostName: String,
    awsInstanceId: String,
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("hosts", hostsSchema);
