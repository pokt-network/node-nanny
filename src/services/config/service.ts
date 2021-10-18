import { NodesModel } from "../../models";

export class Service {
  async setNodeStatus({ status, nodeId }) {
    return await NodesModel.findByIdAndUpdate(nodeId, {
      online: status === 'online'
    })
  }
  async getNodeStatus(nodeId) {
    const { online } = await (await NodesModel.findOne({ "_id": nodeId }, { online: 1 }))
    return online
  }
}
