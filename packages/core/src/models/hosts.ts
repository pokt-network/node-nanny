import { Schema, model, Model } from "mongoose";
import { ILocation } from "./locations";

export interface IHost {
  name: string;
  ip: string;
  loadBalancer: boolean;
  location: ILocation;

  hostType: string;

  internalIpaddress?: string;
  internalHostName?: string;
  externalHostName?: string;
  awsInstanceId?: string;
}

export const hostsSchema = new Schema<IHost>(
  {
    name: { type: String, unique: true, required: true },
    ip: { type: String, unique: true, required: true },
    loadBalancer: { type: Boolean, required: true },
    location: { type: Schema.Types.ObjectId, ref: "locations" },

    hostType: String,

    internalIpaddress: String,
    internalHostName: String,
    externalHostName: String,
    awsInstanceId: String,
  },
  { timestamps: true },
);

export const HostsModel: Model<IHost> = model("hosts", hostsSchema);
