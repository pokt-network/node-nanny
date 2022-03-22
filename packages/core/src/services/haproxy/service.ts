import { exec } from "child_process";

import { IHAProxyParams } from "./types";

export class Service {
  async disableServer({ backend, server, destination }: IHAProxyParams) {
    const cmd = `echo "disable server ${backend}/${server}" | nc -v ${destination} 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async enableServer({ backend, server, destination }: IHAProxyParams) {
    const cmd = `echo "enable server ${backend}/${server}" | nc -v ${destination} 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async getServerStatus({ backend, server, destination }: IHAProxyParams) {
    const raw = await this.getCurrentStateByChainCommand({ backend, destination });
    const lines = raw.split("\n");
    for (const line of lines) {
      if (line.includes(backend) && line.includes(server)) {
        return Number(line.split(" ")[5]) === 2;
      }
    }

    return null;
  }

  async getServerCount({ backend, destination }: IHAProxyParams) {
    const raw = await this.getCurrentStateByChainCommand({ backend, destination });
    const lines = raw.split("\n");
    return lines.filter((line) => {
      return line.includes(backend) && Number(line.split(" ")[5]) === 2;
    }).length;
  }

  private async getCurrentStateByChainCommand({
    backend,
    destination,
  }: IHAProxyParams): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        `echo "show servers state ${backend}" | nc -v ${destination} 9999`,
        (error, stdout) => {
          if (error) {
            reject(`error: ${error.message}`);
          }
          resolve(stdout);
        },
      );
    });
  }
}
