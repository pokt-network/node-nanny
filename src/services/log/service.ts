import AWS from "aws-sdk";
import { GroupStreamParams, PutLogParams, LogGroupPrefix } from "./types";

export class Service {
  private client: AWS.CloudWatchLogs;
  private today: string;
  constructor() {
    this.today = new Date().toDateString();
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
      console.log(error);
      return {};
    }
  }

  private async doesLogStreamExist({
    logGroupName,
    logStreamName,
  }: GroupStreamParams): Promise<boolean> {
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
      console.log(error);
      return {};
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
      if (error.code === "InvalidSequenceTokenException") {
        const nextSequenceToken = error.message
          .split("The next expected sequenceToken is: ")[1]
          .trim();
        return await this.client
          .putLogEvents({
            logGroupName,
            logStreamName,
            logEvents,
            sequenceToken: nextSequenceToken,
          })
          .promise();
      }
    }
  }

  private async getSequenceTokenForLogStream({
    logGroupName,
    logStreamName: name,
  }: GroupStreamParams): Promise<string> {
    try {
      const { logStreams } = await this.client
        .describeLogStreams({ logGroupName, logStreamNamePrefix: name })
        .promise();

      const [{ logStreamName, uploadSequenceToken }] = logStreams;

      if (logStreamName !== name) {
        throw new Error(`could not find specific log stream but found similar stream name`);
      }
      return uploadSequenceToken;
    } catch (error) {
      console.log(error);
    }
  }
  private async setupLogs(logGroupName) {
    const streamExist = await this.doesLogStreamExist({
      logGroupName,
      logStreamName: this.today,
    });
    if (!streamExist) {
      await this.createLogStream({ logGroupName, logStreamName: this.today });
    }
    return {
      logGroupName,
      logStreamName: this.today,
      sequenceToken: await this.getSequenceTokenForLogStream({
        logGroupName,
        logStreamName: this.today,
      }),
    };
  }

  async write({ message, logGroupName }) {
    const { logStreamName, sequenceToken } = await this.setupLogs(logGroupName);
    return await this.writeToLogStream({
      logGroupName,
      logStreamName,
      sequenceToken,
      logEvents: [{ message, timestamp: Date.now() }],
    });
  }

  async subscribeToLogGroup(logGroupName) {
    try {
      return await this.client
        .putSubscriptionFilter({
          destinationArn:
            "arn:aws:firehose:us-east-2:059424750518:deliverystream/DatadogCWLogsforwarder",
          filterName: "DDFilter",
          filterPattern: "",
          logGroupName,
          roleArn: "arn:aws:iam::059424750518:role/CWLtoKinesisRole",
        })
        .promise();
    } catch (error) {
      throw new Error(`could not subscribe log group ${error} ${logGroupName}`);
    }
  }

  async setRetentionPeriod(logGroupName) {
    return await this.client
      .putRetentionPolicy({
        logGroupName,
        retentionInDays: 1,
      })
      .promise();
  }

  async onBoardNewNode(name) {
    const logGroupName = `/pocket/nodemonitoring/${name}`;
    const doesLogGroupExist = await this.doesLogGroupExist(logGroupName);

    if (!doesLogGroupExist) {
      await this.createLogGroup(logGroupName);
    }

    const filterStatus = await this.client.describeSubscriptionFilters({ logGroupName }).promise();

    if (filterStatus.subscriptionFilters.length !== 0) {
      //subcription already exists
      return logGroupName;
    }
    await this.subscribeToLogGroup(logGroupName);
    await this.setRetentionPeriod(logGroupName);
    return logGroupName;
  }
}
