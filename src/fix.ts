import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Service } from "../src/services/datadog"

const dd = new Service()

const fix = async () => {

    await connect()

    // const res = await NodesModel.updateMany({},{hasPeer: true, $unset: {hasPeers: ""}}).exec()
    // console.log(res)

    const all = await NodesModel.find({ "chain.name": { $ne: "POKT" } }).exec()

    for (const node of all) {
        if (node.host.name.includes("harmony")) {
            const res = await NodesModel.updateOne({ _id: node._id }, { compose: "hmy-mainnet" }).exec()
            console.log(res)
        }

    }


    return
}

fix()