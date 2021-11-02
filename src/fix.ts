import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Service } from "../src/services/datadog";

const dd = new Service();

const fix = async () => {
  await connect();

  const {data: monitors} = await dd.getAllMonitorsByTag("Smart_Monitorv2")


  for(const monitor of monitors) {
    if(monitor.query.includes(" > 4")){
      console.log(monitor)
    }
  }

  return;
};

fix();
