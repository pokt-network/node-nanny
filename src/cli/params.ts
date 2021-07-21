#!/usr/bin/env node
const { ConfigManager } = require("../../dist/services");
const [, , command, arg1, arg2, arg3] = process.argv;

const config = new ConfigManager();

const commands = {
  "set-param": () => config.setParam({ chain: arg1, param: arg2, value: arg3 }),
  "get-param": () => config.getParam({ chain: arg1, param: arg2 }),
}
  [command]()
  .then(console.log);
