import { Schema, model, Model, Document } from 'mongoose'

enum HostType {
    AWS = "AWS",
    OVH = "OVH"
}

interface IHosts {
    name: string
    internalIpaddress: string
    internalHostName: string
    externalHostName: string
    awsInstanceId: string
    loadbalancer: boolean
    dockerHost: boolean
    hostType: HostType
}

interface peer {
    url: string
    id: string
}

export interface INode {
    backend: string
    chain: string
    container: string
    externalNodes: string[]
    host: IHosts
    hostname: string
    monitorId: string
    online: boolean
    peer: peer[]
    port: number
    threshold: number
    url: string
    variance: number
}

const hostsSchema = new Schema<IHosts>(
    {
        name: String,
        internalIpaddress: String,
        internalHostName: String,
        externalHostName: String,
        awsInstanceId: String,
        loadbalancer: Boolean,
        dockerHost: Boolean,
        hostType: String

    }
)


const peerSchema = new Schema({
    url: String,
    id: String
})

const nodesSchema = new Schema<INode>(
    {
        backend: String,
        chain: String,
        container: String,
        externalNodes: [String],
        host: hostsSchema,
        hostname: String,
        monitorId: String,
        online: Boolean,
        peer: [peerSchema],
        port: Number,
        threshold: Number,
        url: String,
        variance: Number,
    },
    { collection: 'nodes' }
)

const NodesModel: Model<INode> = model(
    'nodes',
    nodesSchema
)

export { NodesModel }