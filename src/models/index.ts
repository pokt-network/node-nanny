import { Schema, model, Model } from 'mongoose'

enum HostType {
    AWS = "AWS",
    OVH = "OVH"
}

export interface IHost {
    name: string
    internalIpaddress: string
    internalHostName: string
    externalHostName: string
    awsInstanceId: string
    loadBalancer: boolean
    dockerHost: boolean
    hostType: HostType
}

interface IChain {
    chain: string
    name: string
    type: string
}

export interface IOracle {
    chain: string,
    urls: string[]
}

export interface INode {
    id: string
    backend: string
    chain: IChain
    container: string
    haProxy: boolean
    hasPeers: boolean
    reboot: boolean
    host: IHost
    hostname: string
    monitorId: string
    online: boolean
    port: number
    server: string
    threshold: number
    url: string
    variance: number
    logGroup: string
    nginx: string
    poktType: string
    peer: string
}

const chainSchema = new Schema<IChain>({
    chain: String,
    name: String,
    type: String,
})

const oracleSchema = new Schema<IOracle>({
    chain: { type: String, required: true, unique: true },
    urls: [String]
})

const hostsSchema = new Schema<IHost>(
    {
        name: String,
        internalIpaddress: String,
        internalHostName: String,
        externalHostName: String,
        awsInstanceId: String,
        loadBalancer: Boolean,
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
        haProxy: Boolean,
        reboot: Boolean,
        hasPeers: Boolean,
        host: hostsSchema,
        hostname: { type: String, unique: true },
        monitorId: String,
        online: Boolean,
        port: Number,
        server: String,
        threshold: Number,
        url: String,
        variance: Number,
        logGroup: String,
        nginx: String,
        poktType: String,
        peer: [String]
    },
    { collection: 'nodes' }
)

const ChainsModel: Model<IChain> = model(
    'chains',
    chainSchema
)

const OraclesModel: Model<IOracle> = model(
    'oracles',
    oracleSchema
)

const HostsModel: Model<IHost> = model(
    'hosts',
    hostsSchema
)

const NodesModel: Model<INode> = model(
    'nodes',
    nodesSchema
)

export { HostsModel, NodesModel, OraclesModel, ChainsModel }