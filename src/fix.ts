import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog } from "./services";
const dd = new DataDog();
const retool = new Retool();

const fix = async () => {
  await connect();

 //const status =  await retool.getHaProxyStatus('61563127857d870012a409bd')
 //console.log(status);

  return;
};

fix();
