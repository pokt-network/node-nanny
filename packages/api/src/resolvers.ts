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
    node: (_, { id }) =>
      NodesModel.findOne({ _id: id })
        .populate('chain')
        .populate({ path: 'host', populate: 'location' })
        .populate('loadBalancers')
        .exec(),

    chains: () => ChainsModel.find({}).exec(),
    hosts: () => HostsModel.find({}).populate('location').sort({ name: 1 }).exec(),
    locations: () => LocationsModel.find({}).exec(),
    nodes: () =>
      NodesModel.find({})
        .populate('chain')
        .populate({ path: 'host', populate: 'location' })
        .populate('loadBalancers')
        .exec(),
    oracles: () => OraclesModel.find({}).exec(),
    webhooks: () => WebhookModel.find({}).exec(),

    logs: (_, { input }) => new LogService().getLogsForNodes(input),
    logsForChart: (_, { input }) => new LogService().getLogsForChart(input),

    getHaProxyStatus: (_, { id }) => new AutomationService().getHaProxyStatus(id),
    checkValidHaProxy: (_, { input }) => new AutomationService().checkValidHaProxy(input),
    getServerCount: (_, { id }) => new AutomationService().getServerCountForUi(id),
    getHealthCheck: (_, { id }) => new AutomationService().getHealthCheck(id),
  },

  Mutation: {
    createHost: (_, { input }) => new AutomationService().createHost(input),
    createLocation: (_, { name }) => LocationsModel.create({ name }),
    createNode: (_, { input }) => new AutomationService().createNode(input),
    createNodesCSV: (_, { nodes }) => new AutomationService().createNodesCSV(nodes),
    createHostsCSV: (_, { hosts }) => new AutomationService().createHostsCSV(hosts),

    createChain: (_, { input }) => new AutomationService().createChain(input),

    updateHost: (_, { update }) => new AutomationService().updateHost(update),
    updateNode: (_, { update }) => new AutomationService().updateNode(update),

    updateChain: (_, { update }) => new AutomationService().updateChain(update),
    updateOracle: (_, { update }) => new AutomationService().updateOracle(update),

    deleteHost: (_, { id }) => new AutomationService().deleteHost(id),
    deleteLocation: async (_, { id }) => !!(await LocationsModel.deleteOne({ id })),
    deleteNode: (_, { id }) => new AutomationService().deleteNode(id),

    muteMonitor: (_, { id }) => new AutomationService().muteMonitor(id),
    unmuteMonitor: (_, { id }) => new AutomationService().unmuteMonitor(id),
    enableHaProxyServer: (_, { id }) => new AutomationService().addToRotation(id),
    disableHaProxyServer: (_, { id }) => new AutomationService().removeFromRotation(id),
  },
};

export default resolvers;
