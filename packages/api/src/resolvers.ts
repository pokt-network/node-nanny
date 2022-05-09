import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LocationsModel,
  WebhookModel,
} from "@pokt-foundation/node-nanny-core/dist/models";
import {
  Automation as AutomationService,
  Log as LogService,
} from "@pokt-foundation/node-nanny-core/dist/services";

const resolvers: {
  [queryType: string]: { [queryName: string]: (_: any, args: any) => any };
} = {
  Query: {
    node: async (_, { id }) =>
      NodesModel.findOne({ _id: id })
        .populate("chain")
        .populate({ path: "host", populate: "location" })
        .populate("loadBalancers")
        .exec(),

    chains: async () => ChainsModel.find({}).exec(),
    hosts: async () => HostsModel.find({}).populate("location").sort({ name: 1 }).exec(),
    locations: async () => LocationsModel.find({}).exec(),
    nodes: async () =>
      NodesModel.find({})
        .populate("chain")
        .populate({ path: "host", populate: "location" })
        .populate("loadBalancers")
        .exec(),
    oracles: async () => OraclesModel.find({}).populate("chain").exec(),
    webhooks: async () => WebhookModel.find({}).exec(),

    logs: async (_, { input }) => new LogService().getLogsForNodes(input),
    logsForChart: async (_, { input }) => new LogService().getLogsForChart(input),

    getHaProxyStatus: async (_, { id }) => new AutomationService().getHaProxyStatus(id),
    checkValidHaProxy: async (_, { input }) =>
      new AutomationService().checkValidHaProxy(input),
    getServerCount: async (_, { id }) => new AutomationService().getServerCountForUi(id),
    getHealthCheck: async (_, { id }) => new AutomationService().getHealthCheck(id),
  },

  Mutation: {
    createHost: async (_, { input }) => new AutomationService().createHost(input),
    createLocation: async (_, { name }) => LocationsModel.create({ name }),
    createNode: async (_, { input }) => new AutomationService().createNode(input),
    createNodesCSV: async (_, { nodes }) => new AutomationService().createNodesCSV(nodes),
    createHostsCSV: async (_, { hosts }) => new AutomationService().createHostsCSV(hosts),

    updateHost: async (_, { update }) => new AutomationService().updateHost(update),
    updateNode: async (_, { update }) => new AutomationService().updateNode(update),

    deleteHost: async (_, { id }) => new AutomationService().deleteHost(id),
    deleteLocation: async (_, { id }) => !!(await LocationsModel.deleteOne({ id })),
    deleteNode: async (_, { id }) => new AutomationService().deleteNode(id),

    muteMonitor: async (_, { id }) => new AutomationService().muteMonitor(id),
    unmuteMonitor: async (_, { id }) => new AutomationService().unmuteMonitor(id),
    enableHaProxyServer: async (_, { id }) => new AutomationService().addToRotation(id),
    disableHaProxyServer: async (_, { id }) =>
      new AutomationService().removeFromRotation(id),
  },
};

export default resolvers;
