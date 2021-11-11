import AWS from "aws-sdk";

export class Service {
  private sns: AWS.SNS;

  constructor() {
    this.sns = new AWS.SNS({region: 'us-east-2'});
  }
  async sendMessage(data: any) {
    const requestParams = {
     Message: JSON.stringify(data),
     TopicArn: "arn:aws:sns:us-east-2:059424750518:BlockchainMonitor",
    
    };

    const messageAcknowledge = await this.sns.publish(requestParams).promise();
    return messageAcknowledge;
  }
}
