import { exec } from "child_process";
import path from "path";

enum NodeTypes {
  DATA = "data",
  POKT = "pokt",
}

export class Service {
  rebootDockerContainerFromAgent({ name, type, compose, nginx, poktType }) {
    let cmd, script;
    if (type == NodeTypes.DATA) {
      script = path.resolve(__dirname, "../../../scripts/agent_reboot.sh");
      cmd = `sh ${script} ${name} ${compose}`;
    }
    if (type === NodeTypes.POKT) {
      script = path.resolve(__dirname, "../../../scripts/agent_reboot_pokt.sh");
      cmd = `sh ${script} ${name} ${nginx} ${poktType}`;
    }

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        if (stderr) {
          resolve(stderr);
        }
        resolve(stdout);
      });
    });
  }

  restartService(service) {
    return new Promise((resolve, reject) => {
      exec(`sudo service ${service} restart`, (error, stdout, stderr) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        if (stderr) {
          resolve(stderr);
        }
        resolve(stdout);
      });
    });
  }
}
