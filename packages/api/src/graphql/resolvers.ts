import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LocationsModel,
  WebhookModel,
} from "@pokt-foundation/node-monitoring-core/dist/models";
import { Automation as AutomationService } from "@pokt-foundation/node-monitoring-core/dist/services";

const resolvers = {
  Query: {
    chains: async () => await ChainsModel.find({}).exec(),
    hosts: async (_, { loadBalancer }) => {
      const query = loadBalancer ? { loadBalancer } : {};
      return await HostsModel.find(query).populate("location").sort({ name: 1 }).exec();
    },
    locations: async () => await LocationsModel.find({}).exec(),
    node: async (_, { id }) =>
      await NodesModel.find({ _id: id })
        .populate("chain")
        .populate({ path: "host", populate: "location" })
        .exec(),
    nodes: async () =>
      await NodesModel.find({})
        .populate("chain")
        .populate({ path: "host", populate: "location" })
        .exec(),
    oracles: async () => await OraclesModel.find({}).populate("chain").exec(),
    webhooks: async () => await WebhookModel.find({}).exec(),

    logs: async (_, { nodeIds, page, limit, startDate, endDate }) =>
      await new AutomationService().getLogsForNode({
        nodeIds,
        page,
        limit,
        startDate,
        endDate,
      }),

    getHaProxyStatus: async (_, { id }) => {
      return await new AutomationService().getHaProxyStatus(id);
    },
  },

  Mutation: {
    createHost: async (_, host) => {
      return await HostsModel.create(host);
    },
    createNode: async (_, { input }) => {
      return await new AutomationService().createNode(input);
    },
    createNodesCSV: async (_, { nodes }) => {
      return await new AutomationService().createNodesCSV(nodes);
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
  },

  Host: {
    location(host: any) {
      return host.location?.name;
    },
  },
};

export default resolvers;
