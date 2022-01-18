import BaseService from "./base-service";

export class Service extends BaseService {
  constructor() {
    super();
  }
  processTriggered = async (event) => {
    const { id, name, ethSyncing, height, count, conditions } = JSON.parse(event);
    const { server, loadBalancers, chain: _chain } = await this.getNode(id);
    const title = `${name} is ${conditions}`;
    const chain = _chain.name;
    await this.sendError({
      title,
      message: `${name} is ${conditions} \n 
      This event has occured ${count} times since first occurance \n 
      ${ethSyncing ? JSON.stringify(ethSyncing) : ""} \n 
      ${height ? JSON.stringify(height) : ""} \n`,
      chain,
    });
    //
    //  ${this.getHAProxyMessage({ backend, loadBalancers })}
    //
    //if (conditions === this.ErrorConditions.NOT_SYNCHRONIZED) {
    //   await this.sendInfo({
    //     title,
    //     message: `Attemping to remove from rotation \n ${this.getHAProxyMessage({
    //       backend,
    //       loadBalancers,
    //     })}`,
    //     chain,
    //   });
    //   try {
    //     await this.disableServer({ backend, server, loadBalancers });
    //     return await this.sendInfo({
    //       title,
    //       message: `Sucecesfully removed from rotation \n ${this.getHAProxyMessage({
    //         backend,
    //         loadBalancers,
    //       })}`,
    //       chain,
    //     });
    //   } catch (error) {
    //     await this.sendInfo({
    //       title,
    //       message: `Could not remove from rotation \n ${this.getHAProxyMessage({
    //         backend,
    //         loadBalancers,
    //       })}`,
    //       chain,
    //     });
    //   }
    // }
    // return;
  };
  processReTriggered = async (event) => {
    const { id, name, ethSyncing, height, count, conditions } = JSON.parse(event);
    const { loadBalancers, chain: _chain } = await this.getNode(id);
    const title = `${name} is ${conditions}`;
    const chain = _chain.name;
    await this.sendError({
      title,
      message: `${name} is ${conditions} \n 
      This event has occured ${count} times since first occurance \n 
      ${ethSyncing ? JSON.stringify(ethSyncing) : ""} \n 
      ${height ? JSON.stringify(height) : ""} \n
      `,
      chain,
    });
  };
  processResolved = async (event) => {
    const { id, name, ethSyncing, height, count, conditions } = JSON.parse(event);
    const { server, loadBalancers, chain: _chain } = await this.getNode(id);
    const title = `${name} is ${conditions}`;
    const chain = _chain.name;
    await this.sendSucess({
      title,
      message: `${name} is ${conditions} \n This event has occured ${count} times since first occurance \n ${
        ethSyncing ? JSON.stringify(ethSyncing) : null
      } \n ${height ? JSON.stringify(height) : null}`,
      chain,
    });
    // if (conditions === this.ErrorConditions.NOT_SYNCHRONIZED) {
    //   await this.sendInfo({ title, message: "Attemping to add to rotation", chain });
    //   try {
    //     await this.enableServer({ backend, server, loadBalancers });
    //     await this.sendInfo({ title, message: "Sucecesfully add to rotation", chain });
    //   } catch (error) {
    //     await this.sendSucess({ title, message: "Could not add to rotation", chain });
    //   }
    // }
  };
}
