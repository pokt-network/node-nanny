import AWS from "aws-sdk";

interface GroupStreamParams {
  logGroupName: string;
  logStreamName: string;
}

interface LogEvent {
  message: string;
  timestamp: number;
}

interface PutLogParams extends GroupStreamParams {
  logEvents: LogEvent[];
  sequenceToken?: string | null;
}

interface LogTokenResponse {
  nextSequenceToken: string;
}

class Service {
  private client: AWS.CloudWatchLogs;
  constructor() {
    this.client = new AWS.CloudWatchLogs({
      region: "us-east-2",
    });
  }

  async doesLogGroupExist(name: string): Promise<boolean> {
    try {
      const { logGroups } = await this.client
        .describeLogGroups({ logGroupNamePrefix: name })
        .promise();
      const [logGroup] = logGroups;
      return logGroup.logGroupName === name;
    } catch (error) {
      return false;
    }
  }

  async createLogGroup(logGroupName: string): Promise<object> {
    try {
      return await this.client.createLogGroup({ logGroupName }).promise();
    } catch (error) {
      throw new Error(`could not create log group ${error}`);
    }
  }

  async doesLogStreamExist({ logGroupName, logStreamName }: GroupStreamParams): Promise<boolean> {
    try {
      const { logStreams } = await this.client
        .describeLogStreams({
          logGroupName,
          logStreamNamePrefix: logStreamName,
        })
        .promise();
      const [logStream] = logStreams;
      return logStream.logStreamName === logStreamName;
    } catch (error) {
      return false;
    }
  }
  async createLogStream({ logGroupName, logStreamName }: GroupStreamParams): Promise<object> {
    try {
      return await this.client.createLogStream({ logGroupName, logStreamName }).promise();
    } catch (error) {
      throw new Error(`could not create log stream ${error}`);
    }
  }

  async writeToLogStream({
    logGroupName,
    logStreamName,
    logEvents,
    sequenceToken,
  }: PutLogParams): Promise<AWS.CloudWatchLogs.PutLogEventsResponse> {
    try {
      return await this.client
        .putLogEvents({ logGroupName, logStreamName, logEvents, sequenceToken })
        .promise();
    } catch (error) {
      throw new Error(`could not write to log stream ${error}`);
    }
  }

  async getSequenceTokenforLogStream({
    logGroupName,
    logStreamName: name,
  }: GroupStreamParams): Promise<string> {
    try {
      const { logStreams } = await this.client
        .describeLogStreams({ logGroupName, logStreamNamePrefix: name })
        .promise();

      const [{ logStreamName, uploadSequenceToken }] = logStreams;

      if (logStreamName !== name) {
        throw new Error(`could not find specfic log stream but found similar stream name?`);
      }
      return uploadSequenceToken;
    } catch (error) {
      throw new Error(`could not find log stream ${error}`);
    }
  }
}

export { Service };
