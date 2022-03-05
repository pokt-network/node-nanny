import { Schema, model, Model } from "mongoose";
import { ILocation } from "./locations";

export interface IHost {
  name: string;
  loadBalancer: boolean;
  location: ILocation;
  ip?: string;
  fqdn?: string;

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
    ip: { type: String, unique: true },
    fqdn: { type: String, unique: true },

    hostType: String,

    internalIpaddress: String,
    internalHostName: String,
    externalHostName: String,
    awsInstanceId: String,
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("hosts", hostsSchema);
