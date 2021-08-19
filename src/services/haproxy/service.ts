import { exec } from "child_process";

export class Service {
  private async getCurrentStateByChainCommand(chain): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`echo "show servers state ${chain}" | nc -v localhost 9999`, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  private async getStatus(chain) {
    const raw = await this.getCurrentStateByChainCommand(chain);
    const lines = raw.split("\n");
    const [, , a, b] = lines;
    const aStatusNum = Number(a.split(" ")[5]);
    const bStatusNum = Number(b.split(" ")[5]);
    const aStatus = aStatusNum === 2;
    const bStatus = bStatusNum === 2;
    const allOnline = aStatus === true && bStatus === true;
    return { aStatus, bStatus, allOnline };
  }

  private async disableServerCommand({ chain, host }) {
    return new Promise((resolve, reject) => {
      exec(
        `echo "disable server ${chain}/${chain}-${host}" | nc -v localhost 9999`,
        (error, stdout) => {
          if (error) {
            reject(`error: ${error.message}`);
          }
          resolve(stdout);
        },
      );
    });
  }
  private async enableServerCommand({ chain, host }) {
    return new Promise((resolve, reject) => {
      exec(
        `echo "enable server ${chain}/${chain}-${host}" | nc -v localhost 9999`,
        (error, stdout) => {
          if (error) {
            reject(`error: ${error.message}`);
          }
          resolve(stdout);
        },
      );
    });
  }

  async disableServer({ chain, host }) {
    const currentStatus = await this.getStatus(chain);
    if (currentStatus.allOnline) {
      return await this.disableServerCommand({ chain, host });
      //add some follow up checks here, make sure right one removed
    } else {
      throw new Error(`one or more severs already offline ${currentStatus}`);
    }
  }

  async enableServer({ chain, host }) {
    await this.enableServerCommand({ chain, host });
    const currentStatus = await this.getStatus(chain);
    if (currentStatus.allOnline) {
      return true;
    } else {
      throw new Error(`one or more severs are offline ${currentStatus}`);
    }
  }
}
