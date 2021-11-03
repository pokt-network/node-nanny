import { exec } from "child_process";

export class Service {
  private async getCurrentStateByChainCommand(backend): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`echo "show servers state ${backend}" | nc -v localhost 9999`, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async disableServer({ backend, server }) {
    const cmd = `echo "disable server ${backend}/${server}" | nc -v localhost 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }
  async enableServer({ backend, server }) {
    const cmd = `echo "enable server ${backend}/${server}" | nc -v localhost 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async getServerStatus({ backend, server }) {
    const raw = await this.getCurrentStateByChainCommand(backend);
    const lines = raw.split("\n");
    for (const line of lines) {
      if (line.includes(backend) && line.includes(server)) {
        return Number(line.split(" ")[5]) === 2;
      }
    }

    return -1;
  }

  async getServerCount(backend) {
    const raw = await this.getCurrentStateByChainCommand(backend);
    const lines = raw.split("\n");
    return lines.filter((line) => {
      return line.includes(backend) && Number(line.split(" ")[5]) === 2;
    }).length;
  }
}
