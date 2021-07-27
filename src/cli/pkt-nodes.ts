#!/usr/bin/env node
import { Config, Discover } from "../services";
const [, , command, arg1, arg2, arg3] = process.argv;

enum Source {
  CSV = "csv",
  TAG = "tag",
}

const config = new Config.Service();
const discovery = new Discover.Service({ source: Source.TAG });

const commands = {
  "set-param": () => config.setParam({ chain: arg1, param: arg2, value: arg3 }),
  "get-param": () => config.getParam({ chain: arg1, param: arg2 }),
  "get-nodes": () => discovery.getNodesListFromTags(),
}
  [command]()
  .then(command === "get-nodes" ? console.table : console.log);
