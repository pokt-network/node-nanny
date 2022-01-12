import { ChainsModel, NodesModel } from "./models";
import { Health, Event } from "./services";
import { connect } from "./db";
const health = new Health();
const { Redis: Consumer } = Event;
const event = `{"name":"bd-sg1/POL/pol1","status":"ERROR","conditions":"NOT_SYNCHRONIZED","ethSyncing":{"currentBlock":"0x16149ca","highestBlock":"0x163a6a8","knownStates":"0x0","pulledStates":"0x0","startingBlock":"0x159a57e"},"height":{"internalHeight":23153098,"externalHeight":23312829,"delta":159731},"id":"61b2c989d0d63c86ec4676cd","count":16}`;

const exe = async () => {
  await connect();
  await new Consumer().processTriggered(event);
};

exe();
//error http://195.189.97.31:18545
