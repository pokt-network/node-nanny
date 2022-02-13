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


  export const hostsSchema = new Schema<IHost>({
    name: String,
    internalIpaddress: String,
    internalHostName: String,
    externalHostName: String,
    awsInstanceId: String,
    loadBalancer: Boolean,
    hostType: String,
    ip: String,
    location: String
  })

  export const HostsModel: Model<IHost> = model("hosts", hostsSchema);