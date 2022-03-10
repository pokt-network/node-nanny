import { IHost, INode } from "../../../../models";
import { HealthTypes } from "../../../../types";

export interface IRedisEvent extends HealthTypes.IHealthResponse {
  id: string;
  count: number;
}

export interface IRotationParams {
  backend: string;
  loadBalancers: IHost[];
  server?: string;
}

export interface IToggleServerParams {
  node: INode;
  title: string;
  enable: boolean;
}

export interface IRedisEventParams {
  title: string;
  message: string;
  node: INode;
  notSynced: boolean;
  status: HealthTypes.EErrorStatus;
}
