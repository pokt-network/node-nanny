import { exec } from "child_process";
import path from "path";

enum NodeTypes {
  DATA = "DATA",
  POKT = "POKT"
}

export class Service {
  rebootDockerContainerFromAgent({ name, type, nginx, poktType }) {
    let cmd, script
    if (type == NodeTypes.DATA) {
      script = path.resolve(__dirname, "../../../scripts/agent_reboot.sh");
      cmd = `sh ${script} ${name} ${nginx} ${poktType}`
    }

    if (type === NodeTypes.POKT) {
      script = path.resolve(__dirname, "../../../scripts/agent_reboot_pokt.sh");
      cmd = `sh ${script} ${name}`
    }

    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`nc ${error}`);
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
