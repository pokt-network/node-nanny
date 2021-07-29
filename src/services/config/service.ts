import AWS from "aws-sdk";
import { Alert } from "../../services";

import { ConfigPrefix } from "./types";

export class Service {
  private alert: Alert;
  private client: AWS.SSM;
  constructor() {
    this.alert = new Alert();
    this.client = new AWS.SSM({ region: "us-east-2" });
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
      this.alert.sendErrorAlert(`could not set parameter ${error}`);
    }
  }

  async getParam({ chain, param }) {
    const key = `${ConfigPrefix.CHAIN_HEALTH}/${chain}/${param}`;
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      return Parameter.Value;
    } catch (error) {
      this.alert.sendErrorAlert(`could not find parameter ${error}`);
    }
  }

  async getParamByKey(key: string) {
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      const { Name, Value } = Parameter;
      return { Name, Value };
    } catch (error) {
      this.alert.sendErrorAlert(`could not get parambykey`);
    }
  }
}
