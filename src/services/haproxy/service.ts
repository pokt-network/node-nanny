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

  private async getStatus(backend) {
    const raw = await this.getCurrentStateByChainCommand(backend);
    const lines = raw.split("\n");
    const [, , a, b] = lines;
    const aStatusNum = Number(a.split(" ")[5]);
    const bStatusNum = Number(b.split(" ")[5]);
    const aStatus = aStatusNum === 2;
    const bStatus = bStatusNum === 2;
    const allOnline = aStatus === true && bStatus === true;
    return { aStatus, bStatus, allOnline };
  }

  private async disableServerCommand({ backend, host }) {
    const cmd = `echo "disable server ${backend}/${host}" | nc -v localhost 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }
  private async enableServerCommand({ backend, host }) {
    const cmd = `echo "enable server ${backend}/${host}" | nc -v localhost 9999`;
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout) => {
        if (error) {
          reject(`error: ${error.message}`);
        }
        resolve(stdout);
      });
    });
  }

  async disableServer({ backend, host }) {
    const currentStatus = await this.getStatus(backend);
    if (currentStatus.allOnline) {
      return await this.disableServerCommand({ backend, host });
    } else {
      throw new Error(`one or more severs already offline ${currentStatus}`);
    }
  }

  async enableServer({ backend, host }) {
    await this.enableServerCommand({ backend, host });
    const currentStatus = await this.getStatus(backend);
    if (currentStatus.allOnline) {
      return true;
    } else {
      throw new Error(`one or more severs are offline ${currentStatus}`);
    }
  }
}
