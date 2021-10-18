import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";

const fix = async () => {
    await connect()
    const allNodes = await NodesModel.find({})

    for (const node of allNodes) {
        const res = await NodesModel.findOneAndUpdate({ _id: node._id }, { reboot: false })
        console.log(res)
    }
    return
}



fix()