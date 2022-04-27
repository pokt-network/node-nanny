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

    const total = lines.filter((line) => {
      return line.includes(destination) && (!dispatch || !line.includes("mainnet"));
    });
    const online = total.filter((line) => {
      return Number(line.split(" ")[5]) === 2;
    });

    return { online: online.length, total: total.length };
  }

  async getValidHaProxy({ destination, domain }: IHAProxyParams) {
    try {
      const response = await this.getCurrentStateByChainCommand({ destination, domain });
      if (response.includes("Can't find backend")) return false;
      return true;
    } catch {
      console.log("ERROR");
      return false;
    }
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
