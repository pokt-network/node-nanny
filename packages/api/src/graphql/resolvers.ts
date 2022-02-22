import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LogsModel,
  WebhookModel,
} from "@pokt-foundation/node-monitoring-core/dist/models";

const resolvers = {
  Query: {
    chains: async () => await ChainsModel.find({}).exec(),
    hosts: async (_, { loadBalancer }) => {
      const query = loadBalancer === true ? { loadBalancer } : {};
      return await HostsModel.find(query).sort({ name: 1 }).exec();
    },
    logs: async ({ id }) => await LogsModel.find({ label: id }).exec(),
    nodes: async () => await NodesModel.find({}).populate("chain").populate("host").exec(),
    oracles: async () => await OraclesModel.find({}).populate("chain").exec(),
    webhooks: async () => await WebhookModel.find({}).exec(),
  },

  Mutation: {
    createChain: async (_, chain) => {
      return await ChainsModel.create(chain);
    },
    createHost: async (_, host) => {
      return await HostsModel.create(host);
    },
    createNode: async (_, { input }) => {
      return await NodesModel.create(input);
    },
    createOracle: async (_, { chain, url }) => {
      const doesExist = await OraclesModel.findOne({ chain }).exec();
      if (!doesExist) {
        return await OraclesModel.create({ chain, urls: [url] });
      }
      return await OraclesModel.findOneAndUpdate({ chain }, { $push: { urls: url } }).exec();
    },
    createWebhook: async (_, webhook) => {
      return await WebhookModel.create(webhook);
    },
  },

  /* Return MongoDB ObjectId field `_id` for all types as `id` */
  Chain: {
    id(chain: any) {
      return chain._id;
    },
  },
  Host: {
    id(host: any) {
      return host._id;
    },
  },
  Node: {
    id(node: any) {
      return node._id;
    },
  },
  Oracle: {
    id(oracle: any) {
      return oracle._id;
    },
    chain(oracle: any) {
      return oracle.chain.name;
    },
  },
  Webhook: {
    id(webhook: any) {
      return webhook._id;
    },
    chain(oracle: any) {
      return oracle.chain.name;
    },
  },
};

export default resolvers;
