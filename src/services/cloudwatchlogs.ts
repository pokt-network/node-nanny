import AWS from "aws-sdk";

class Service {
  client: AWS.CloudWatchLogs;
  constructor() {
    this.client = new AWS.CloudWatchLogs({ region: "us-east-2" });
  }
}

export { Service };
