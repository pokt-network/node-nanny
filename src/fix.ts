import { connect } from "./db";
import { INode, NodesModel } from "./models";




const fix = async () => {
    await connect()
    console.log("connected")


    const allNodes = await NodesModel.find({})

    for (const node of allNodes) {
        if (node.chain.name === "POKT") {
            const res = await NodesModel.findOneAndUpdate({ _id: node._id }, { logGroup: `/pocket/nodemonitoring/${node.hostname}` })
            console.log(res)
        } else {

            const res = await NodesModel.findOneAndUpdate({ _id: node._id }, { logGroup: `/pocket/nodemonitoring/${node.host.name.toLowerCase()}/${node.chain.name.toLowerCase()}` })

            console.log(res)

        }





    }
    return
}





fix()