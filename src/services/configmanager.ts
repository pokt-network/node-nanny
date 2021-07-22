import AWS from "aws-sdk";

class Service {
  private client: AWS.SSM;
  constructor() {
    this.client = new AWS.SSM({ region: "us-east-2" });
  }

  async setParam({ chain, param, value }) {
    try {
      return await this.client
        .putParameter({
          Name: `/Pocket/Monitoring/Config/${chain}/${param}`,
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
    const key = `/Pocket/Monitoring/Config/${chain}/${param}`;
    try {
      const { Parameter } = await this.client.getParameter({ Name: key }).promise();
      return Parameter.Value;
    } catch (error) {
      throw new Error(`could not find parameter ${error}`);
    }
  }

  async getParamsByChain({ chain }) {}

  async getParamSummary() {}
}

export { Service };
