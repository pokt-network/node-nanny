import {
  NodesModel,
  HostsModel,
  ChainsModel,
  OraclesModel,
  LocationsModel,
  WebhookModel,
} from '@pokt-foundation/node-nanny-core/dist/models';
import {
  Automation as AutomationService,
  Log as LogService,
} from '@pokt-foundation/node-nanny-core/dist/services';

const resolvers: {
  [queryType: string]: { [queryName: string]: (_: any, args: any) => any };
} = {
  Query: {
    node: async (_, { id }) =>
      NodesModel.findOne({ _id: id })
        .populate('chain')
        .populate({ path: 'host', populate: 'location' })
        .populate('loadBalancers')
        .exec(),

    chains: async () => ChainsModel.find({}).exec(),
    hosts: async () => HostsModel.find({}).populate('location').sort({ name: 1 }).exec(),
    locations: async () => LocationsModel.find({}).exec(),
    nodes: async () =>
      NodesModel.find({})
        .populate('chain')
        .populate({ path: 'host', populate: 'location' })
        .populate('loadBalancers')
        .exec(),
    oracles: async () => OraclesModel.find({}).populate('chain').exec(),
    webhooks: async () => WebhookModel.find({}).exec(),

    logs: async (_, { input }) => await new LogService().getLogsForNodes(input),
    logsForChart: async (_, { input }) => await new LogService().getLogsForChart(input),

    getHaProxyStatus: async (_, { id }) => {
      return await new AutomationService().getHaProxyStatus(id);
    },
    checkValidHaProxy: async (_, { input }) => {
      return await new AutomationService().checkValidHaProxy(input);
    },
    getServerCount: async (_, { id }) => {
      return await new AutomationService().getServerCountForUi(id);
    },
  },

  Mutation: {
    createHost: async (_, { input }) => {
      return await new AutomationService().createHost(input);
    },
    createLocation: async (_, { name }) => {
      return await LocationsModel.create({ name });
    },
    createNode: async (_, { input }) => {
      return await new AutomationService().createNode(input);
    },
    createNodesCSV: async (_, { nodes }) => {
      return await new AutomationService().createNodesCSV(nodes);
    },
    createHostsCSV: async (_, { hosts }) => {
      return await new AutomationService().createHostsCSV(hosts);
    },

    updateHost: async (_, { update }) => {
      return await new AutomationService().updateHost(update);
    },
    updateNode: async (_, { update }) => {
      return await new AutomationService().updateNode(update);
    },

    deleteHost: async (_, { id }) => {
      return await new AutomationService().deleteHost(id);
    },
    deleteLocation: async (_, { id }) => {
      return !!(await LocationsModel.deleteOne({ id }));
    },
    deleteNode: async (_, { id }) => {
      return await new AutomationService().deleteNode(id);
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
};

export default resolvers;
