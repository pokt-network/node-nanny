import AWS from "aws-sdk";
import { response } from "express";
import { NodesModel } from "../../models";
import mongoose from "mongoose";

import { ConfigPrefix } from "./types";

export class Service {
  private client: AWS.SSM;
  constructor() {
    this.client = new AWS.SSM({ region: "us-east-2" });
  }

  async getMonitorId({ chain, host }) {
    const key = `/pocket/monitoring/config/monitor/${chain}/${host}`;
    return await this.getParamByKey(key);
  }

  async getParam({ chain, param }) {
    const key = `${ConfigPrefix.CHAIN_HEALTH}/${chain}/${param}`;
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      return Parameter.Value;
    } catch (error) {
      return false;
    }
  }

  async getParamByKey(key: string) {
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      const { Name, Value } = Parameter;
      return { Name, Value };
    } catch (error) {
      throw new Error(`could not get parambykey ${key} ${error}`);
    }
  }

  async getParamsByPrefix(suffix: string) {
    try {
      const { Parameters } = await this.client.getParametersByPath({ Path: suffix }).promise(); //getParameter({ Name: key }).promise();
      return Parameters.map(({ Name, Value }) => {
        return { Name, Value };
      });
    } catch (error) {
      throw new Error(`could not get params by prefix${error}`);
    }
  }

  async setParam({ chain, param, value }) {
    try {
      return await this.client
        .putParameter({
          Name: `${ConfigPrefix.CHAIN_HEALTH}/${chain}/${param}`,
          Value: value,
          Overwrite: true,
          Type: "String",
        })
        .promise();
    } catch (error) {
      throw new Error(`could not set parameter ${error}`);
    }
  }

  async setParameter({ key, value }) {
    try {
      return await this.client
        .putParameter({
          Name: key,
          Value: String(value),
          Overwrite: true,
          Type: "String",
        })
        .promise();
    } catch (error) {
      throw new Error(`could not set parameter ${error}`);
    }
  }
  async setNodeStatus({ status, nodeId }) {
    return await NodesModel.findByIdAndUpdate(nodeId, {
      online: status === 'online'
    })
  }

  async getNodeStatus(nodeId) {
    const { online } = await (await NodesModel.findOne({ "_id": nodeId }, { online: 1 }))
    return online
  }
}
