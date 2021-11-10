const { Health, Log } = require("../dist/services");
const { connect } = require("../dist/db");
const health = new Health();
const log = new Log();

exports.handler = async (event) => {
  await connect();
  const body = JSON.parse(event.Records[0].body).Message;
  const node = JSON.parse(body);
  node.id = node._id;
  const { logGroup } = node
  const healthResponse = await health.getNodeHealth(node);
  let message = JSON.stringify(healthResponse);
  console.info({message });
  return await log.write({ message, logGroupName: logGroup });
};
