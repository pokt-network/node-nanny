import { SNS } from "./services";
import { NodesModel } from "./models";
import { connect } from "./db";

export class App {
  private sns: SNS;
  constructor() {
    this.sns = new SNS();
  }

  async main() {
    await connect();
    const nodes = await NodesModel.find({}).exec();
    for (const node of nodes) {
      setInterval(async () => {
        await this.sns.sendMessage(node);
      }, 10000);
    }
  }
}

const app = new App();
app.main();
