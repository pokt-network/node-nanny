import { Schema, model, Model } from 'mongoose'

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

interface IChain {
    chain: string
    name: string
    type: string
}

export interface INode {
    id: string
    backend: string
    chain: IChain
    container: string
    externalNodes: string[]
    host: IHosts
    hostname: string
    monitorId: string
    online: boolean
    port: number
    threshold: number
    url: string
    variance: number
    logGroup: string
}


const chainSchema = new Schema<IChain>({
    chain: String,
    name: String,
    type: String,
})

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



const nodesSchema = new Schema<INode>(
    {
        id: String,
        backend: String,
        chain: chainSchema,
        container: String,
        externalNodes: [String],
        host: hostsSchema,
        hostname: String,
        monitorId: String,
        online: Boolean,
        port: Number,
        threshold: Number,
        url: String,
        variance: Number,
        logGroup: String
    },
    { collection: 'nodes' }
)

const NodesModel: Model<INode> = model(
    'nodes',
    nodesSchema
)

export { NodesModel }