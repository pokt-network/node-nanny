import AWS from "aws-sdk";

enum ConfigPrefix {
  COMMON_URL = "/pocket/monitoring/config/common/url",
  CHAIN_HEALTH = "/pocket/monitoring/config/health",
}

class Service {
  private client: AWS.SSM;
  constructor() {
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
      throw new Error(`could not set paramter ${error}`);
    }
  }

  async getParam({ chain, param }) {
    const key = `${ConfigPrefix.CHAIN_HEALTH}/${chain}/${param}`;
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      return Parameter.Value;
    } catch (error) {
      throw new Error(`could not find parameter ${error}`);
    }
  }

  async getParamsByChain({ chain }) {
    this.client.getParametersByPath();
  }

  async getAllParams() {}
}

export { Service };
