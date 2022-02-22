import { Schema, model, Model } from "mongoose";

export interface IHost {
  name: string;
  internalIpaddress: string;
  internalHostName: string;
  externalHostName: string;
  awsInstanceId: string;
  loadBalancer: boolean;
  hostType: string;
  ip: string;
  location: string;
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
    location: String,
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("hosts", hostsSchema);
