import { Health, Discover } from "..";
import { DiscoverTypes } from "../../types";
import { Service } from "./service";
import { BlockHeightVariance } from "./types";
const health = new Service();
const discover = new Discover({ source: DiscoverTypes.Source.TAG });
test.skip("can compute best case block number", async () => {
  const readings = [9559063, 9559077, 9559075, 9558906];
  const response = health.getBestBlockHeight({ readings, variance: BlockHeightVariance.BSC });
  expect(response).toEqual(9559077);
});

test.skip("can compute best case block number", async () => {
  const response = await health.getAvaHealth(`http://10.0.0.149:9650`);
  console.log(response);
  expect(1).toEqual(1);
});

test.only("can get health from pocket nodes", async () => {
  const { pocketNodes } = await discover.getNodes();

  console.log(pocketNodes)
});

const mockNodes = [
  {
    name: "shared-2a/ava",
    chain: "AVA",
    ip: "10.0.0.149",
    port: "9650",
  },
  {
    name: "shared-2b/ava",
    chain: "AVA",
    ip: "10.0.1.208",
    port: "9650",
  },
];
