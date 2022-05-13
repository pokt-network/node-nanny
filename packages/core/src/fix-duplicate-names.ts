import { connect, disconnect } from 'mongoose';
import { NodesModel } from './models';

/* ------ Script Function Begins ------ */
(async () => {
  await connect(process.env.MONGO_URI);

  const nodes = (
    await NodesModel.find({ frontend: { $exists: false }, dispatch: null })
      .populate('chain')
      .populate({ path: 'host', populate: 'location' })
      .select('chain')
      .select('host')
      .exec()
  ).map(({ chain, host }) => ({
    chain: { name: chain.name },
    host: { location: { name: host.location.name } },
  }));
  console.log(JSON.stringify(nodes));

  await disconnect();
})();
