import { exec } from "child_process";

import { IHAProxyParams } from "./types";

export class Service {
  async disableServer({ destination, server, domain }: IHAProxyParams) {
    const cmd = `echo "disable server ${destination}/${server}" | nc -v ${domain} 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async enableServer({ destination, server, domain }: IHAProxyParams) {
    const cmd = `echo "enable server ${destination}/${server}" | nc -v ${domain} 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async getServerStatus({ destination, server, domain }: IHAProxyParams) {
    const raw = await this.getCurrentStateByChainCommand({ destination, domain });
    const lines = raw.split("\n");
    for (const line of lines) {
      if (line.includes(destination) && line.includes(server)) {
        return Number(line.split(" ")[5]) === 2;
      }
    }

    return null;
  }

  async getServerCount({ destination, domain, dispatch }: IHAProxyParams) {
    const raw = await this.getCurrentStateByChainCommand({ destination, domain });
    const lines = raw.split("\n").filter((line) => !line.includes("backup"));
    return lines.filter((line) => {
      return (
        line.includes(destination) &&
        Number(line.split(" ")[5]) === 2 &&
        (!dispatch || !line.includes("mainnet"))
      );
    }).length;
  }

  private async getCurrentStateByChainCommand({
    destination,
    domain,
  }: IHAProxyParams): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        `echo "show servers state ${destination}" | nc -v ${domain} 9999`,
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
