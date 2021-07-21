import AWS from "aws-sdk";

class Service {
  client: AWS.SSM;
  constructor() {
    this.client = new AWS.SSM({ region: "us-east-2" });
  }

  async setParam({ chain, param, value }) {
    return await this.client
      .putParameter({
        Name: `/Pocket/Monitoring/Config/${chain}/${param}`,
        Value: value,
        Overwrite: true,
        Type: "String",
      })
      .promise();
  }

  async getParam({ chain, param }) {
    const key = `/Pocket/Monitoring/Config/${chain}/${param}`;
    return await this.client.getParameter({ Name: key }).promise();
  }

  async getParamsbyChain({ chain }) {}

  async getParamSummary() {}
}

export { Service };
