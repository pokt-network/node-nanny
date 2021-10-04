import AWS from "aws-sdk";
import { Alert } from "../../services";
import { GroupStreamParams, PutLogParams, LogGroupPrefix } from "./types";

export class Service {
  private alert: Alert;
  private client: AWS.CloudWatchLogs;
  private today: string;
  constructor() {
    this.alert = new Alert();
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
      throw new Error(`could not create log group ${error}`);
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
      throw new Error(`could not find log stream ${error}`);
    }
  }
  private async setupLogs(name) {
    const logGroupName = `${LogGroupPrefix.BASE}${name}`;
    const groupExists = await this.doesLogGroupExist(logGroupName);
    if (!groupExists) {
      await this.createLogGroup(logGroupName);
    }
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

  async write({ message, name }) {
    const { logGroupName, logStreamName, sequenceToken } = await this.setupLogs(name);
    return await this.writeToLogStream({
      logGroupName,
      logStreamName,
      sequenceToken,
      logEvents: [{ message, timestamp: Date.now() }],
    });
  }

  async subscribeToLogGroup(logGroupName) {
    return await this.client.putSubscriptionFilter({
      destinationArn: "arn:aws:firehose:us-east-2:059424750518:deliverystream/DatadogCWLogsforwarder",
      filterName: "DDFilter",
      filterPattern: "",
      logGroupName,
      roleArn: "arn:aws:iam::059424750518:role/CWLtoKinesisRole"
    }).promise();
  }

  async onBoardNewNode(name) {
    const logGroupName = `/Pocket/NodeMonitoring/${name}`

    const doesLogGroupExist = await this.doesLogGroupExist(logGroupName)

    if (!doesLogGroupExist) {
      await this.createLogGroup(logGroupName)
    }

    const filterStatus = await this.client.describeSubscriptionFilters({ logGroupName }).promise()

    if (filterStatus.subscriptionFilters.length !== 0) {
      //subcription already exists
      return logGroupName
    }
    await this.subscribeToLogGroup(logGroupName)
    return logGroupName;
  }

}
