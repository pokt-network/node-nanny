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
  sequenceToken?: string;
}

class Service {
  client: AWS.CloudWatchLogs;
  constructor() {
    this.client = new AWS.CloudWatchLogs({
      region: "us-east-2", //should be dynamic in the future depending on availability zone
    });
  }

  async doesLogGroupExist(name: string): Promise<boolean> {
    try {
      const { logGroups } = await this.client.describeLogGroups({ logGroupNamePrefix: name }).promise();
      const [logGroup] = logGroups;
      return logGroup.logGroupName === name;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  //Todo: replace genenic <object> types with aws specific response types IE: <AWS.CloudWatchLogs.PutLogEventsResponse>
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
      console.error(error);
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

  async writeToLogStream({ logGroupName, logStreamName, logEvents, sequenceToken }: PutLogParams): Promise<object> {
    try {
      return await this.client.putLogEvents({ logGroupName, logStreamName, logEvents, sequenceToken }).promise();
    } catch (error) {
      throw new Error(`could not write to log stream ${error}`);
    }
  }
}

export { Service };
