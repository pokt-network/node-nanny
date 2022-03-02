import { Schema, model, Model } from "mongoose";
import { ILocation } from "./locations";

export interface IHost {
  name: string;
  internalIpaddress: string;
  internalHostName: string;
  externalHostName: string;
  awsInstanceId: string;
  loadBalancer: boolean;
  hostType: string;
  ip: string;
  location: ILocation;
}

export const hostsSchema = new Schema<IHost>(
  {
    name: { type: String, unique: true },
    ip: { type: String, unique: true },
    internalIpaddress: String,
    internalHostName: String,
    externalHostName: String,
    awsInstanceId: String,
    loadBalancer: Boolean,
    hostType: String,
    location: { type: Schema.Types.ObjectId, ref: "locations" },
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("hosts", hostsSchema);
