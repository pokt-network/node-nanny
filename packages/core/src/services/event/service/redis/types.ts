import { IHost, INode } from "../../../../models";
import { HealthTypes } from "../../../../types";

export interface IRedisEvent {
  name: string;
  conditions: HealthTypes.EErrorConditions;
  status: HealthTypes.EErrorStatus;
  health: HealthTypes.IHealthResponse;
  id: string;
  count: number;
  //NEED TYPES
  ethSyncing?: any;
  height?: any;
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
  nodeNotSynced: boolean;
}
