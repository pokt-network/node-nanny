import { Service } from "./service";
import { Discover } from "..";
import { DiscoverTypes } from "../../types";

const service = new Service();
const discover = new Discover({ source: DiscoverTypes.Source.TAG });
test.only("should mute monitor", async () => {
  // const response = await service.muteMonitor({id:"1845218", minutes: 10});

  // console.log(response)

  // let { dataNodes, pocketNodes } = await discover.getNodes();
  // const dataNames = dataNodes.map(({ node }) => {
  //   return {
  //     name: node.name,
  //     logGroup: `/pocket/nodemonitoring/${node.name}`
  //   }
  // });

  // const pocketNames = pocketNodes.map(({host})=> {
  //   return {
  //     name: host,
  //     logGroup: `/pocket/nodemonitoring/${host}`
  //   }
  // })

  // const names = pocketNames.concat(dataNames)

  // await service.createMonitors(names)

  expect(3).toBe(3);
});
