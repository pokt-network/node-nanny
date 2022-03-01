import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LogsModel,
  WebhookModel,
} from "@pokt-foundation/node-monitoring-core/dist/models";
import { Automation as AutomationService } from "@pokt-foundation/node-monitoring-core/dist/services";

const resolvers = {
  Query: {
    chains: async () => await ChainsModel.find({}).exec(),
    hosts: async (_, { loadBalancer }) => {
      const query = loadBalancer ? { loadBalancer } : {};
      return await HostsModel.find(query).sort({ name: 1 }).exec();
    },
    logs: async ({ id }) => await LogsModel.find({ label: id }).exec(),
    node: async (_, { id }) =>
      await NodesModel.find({ _id: id }).populate("chain").populate("host").exec(),
    nodes: async () =>
      await NodesModel.find({}).populate("chain").populate("host").exec(),
    oracles: async () => await OraclesModel.find({}).populate("chain").exec(),
    webhooks: async () => await WebhookModel.find({}).exec(),

    getMuteStatus: async (_, { id }) => {
      return await new AutomationService().getMuteStatus(id);
    },
    getHaProxyStatus: async (_, { id }) => {
      return await new AutomationService().getHaProxyStatus(id);
    },
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
      return await OraclesModel.findOneAndUpdate(
        { chain },
        { $push: { urls: url } },
      ).exec();
    },
    createWebhook: async (_, webhook) => {
      return await WebhookModel.create(webhook);
    },

    muteMonitor: async (_, { id }) => {
      return await new AutomationService().muteMonitor(id);
    },
    unmuteMonitor: async (_, { id }) => {
      return await new AutomationService().unmuteMonitor(id);
    },
    enableHaProxyServer: async (_, { id }) => {
      return await new AutomationService().addToRotation(id);
    },
    disableHaProxyServer: async (_, { id }) => {
      return await new AutomationService().removeFromRotation(id);
    },
    rebootServer: async (_, { id }) => {
      return await new AutomationService().rebootServer(id);
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
  },
  Webhook: {
    id(webhook: any) {
      return webhook._id;
    },
  },
};

export default resolvers;
