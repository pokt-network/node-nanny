import { exec } from "child_process";
import path from "path";


export class Service {
  rebootDockerContainerFromAgent(name) {
    const script = path.resolve(__dirname, "../../../scripts/agent_reboot.sh");
    const cmd = `sh ${script} ${name}`
    console.log(cmd)
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
