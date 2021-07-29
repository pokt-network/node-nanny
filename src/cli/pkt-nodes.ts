#!/usr/bin/env node
import { Config, Discover } from "../services";
import { DiscoverTypes } from "../types";
const [, , command, arg1, arg2, arg3] = process.argv;

const config = new Config();
const discovery = new Discover({ source: DiscoverTypes.Source.TAG });

const commands = {
  "set-param": () => config.setParam({ chain: arg1, param: arg2, value: arg3 }),
  "get-param": () => config.getParam({ chain: arg1, param: arg2 }),
}
[command]()
  .then(console.log);
