import { Types } from "mongoose";
import { connect, disconnect } from "./db";
import { HostsModel, LocationsModel, IHost } from "./models";
import { Service as AutomationService } from "./services/automation";

console.log(process.env.DISCORD_TOKEN);
console.log(process.env.DISCORD_SERVER_ID);

import hostsJSON from "./hosts";
import nodesJSON from "./nodes";

const hostIds = hostsJSON.map(({ _id: { $oid } }) => $oid);
const nodeHostIds = nodesJSON.map(({ host: { $oid } }) => $oid);
const nodesWithHosts = nodeHostIds.filter((id) => hostIds.includes(id));

console.log("HOSTS BEFORE", hostsJSON.length);
console.log("NODES BEFORE", nodesJSON.length);

const getHostLocation = async (host: IHost): Promise<Types.ObjectId> => {
  const hostLocation = host.internalHostName?.split(".")[1];
  const hostLocationCode =
    {
      "us-east-2": "USE2",
      "ap-southeast-1": "APSE1",
      "us-west-2": "USW2",
    }[hostLocation] || "USE2";
  if (hostLocationCode) {
    const [{ _id: locationId }] = await LocationsModel.find({
      name: hostLocationCode as any,
    });
    return locationId;
  }
};

const getFQDN = (node): string => {
  return node?.url.includes("https") ? node.hostname : undefined;
};

const hostIdsMap: { [oldId: string]: Types.ObjectId } = {};
const created: string[] = [];
const loadBalancerIds: Types.ObjectId[] = [];
let hostsCreated: 0;
let nodesCreated: 0;

(async () => {
  await connect();
  for await (const host of hostsJSON) {
    const location = await getHostLocation(host as any);
    const exists = created.includes(host.name);
    if (location && !exists) {
      const node = nodesJSON.find(({ host: { $oid } }) => $oid === host._id.$oid);

      const { id: newId, loadBalancer } = await HostsModel.create({
        name: host.name,
        loadBalancer: host.loadBalancer || false,
        location,
        ip: host.ip,
        fqdn: node ? getFQDN(node) : undefined,
      });

      hostIdsMap[host._id.$oid] = new Types.ObjectId(newId);
      if (loadBalancer) loadBalancerIds.push(new Types.ObjectId(newId));
      hostsCreated++;
      created.push(host.name);
    }
    // console.log("HOST CREATED ...");
  }

  for await (const node of nodesJSON) {
    if (hostIdsMap[node.host.$oid]) {
      await new AutomationService().createNode({
        chain: new Types.ObjectId(node.chain.$oid),
        host: hostIdsMap[node.host.$oid],
        haProxy: node.haProxy,
        port: node.port,
        url: node.url,
        muted: false,
        loadBalancers: loadBalancerIds,
        backend: node.backend,
        server: node.server,
      } as any);
      nodesCreated++;
      // console.log("NODE CREATED ...");
    }
  }

  console.log(`COMPLETED. CREATED ${hostsCreated} HOST AND ${nodesCreated} NODES!`);

  await disconnect();
})();
