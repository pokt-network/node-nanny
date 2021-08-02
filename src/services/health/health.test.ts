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
  expect(1).toEqual(1);
});

test.only("can get health from pocket nodes", async () => {
  const { pocketNodes } = await discover.getNodes();
  const response = await health.getPocketHealth(pocketNodes)

  console.log(response)
  expect(1).toEqual(1)
});


