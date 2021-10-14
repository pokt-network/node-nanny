import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";

const fix = async () => {
    await connect()
    const allNodes = await NodesModel.find({})
    //const res = await NodesModel.findOneAndUpdate({ _id: node._id }, { server })

    for (const node of allNodes) {
        if (node.externalNodes.length > 0 && node.externalNodes[0]) {
            console.log(node.externalNodes)

            const oracle = new OraclesModel({
                chain: node.chain.name,
                urls: node.externalNodes

            })
            await oracle.save()
        }

    }
    return
}



fix()