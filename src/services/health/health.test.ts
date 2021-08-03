import { Health, Discover } from "..";
import { DiscoverTypes } from "../../types";
import { Service } from "./service";
import { BlockHeightVariance } from "./types";
const health = new Service();
const discover = new Discover({ source: DiscoverTypes.Source.TAG });

const mockHighest = 33210;

const mockResults = [
  {
    host: "pocket-2a",
    nodes: [
      { name: "peer-1", height: 33210 },
      { name: "mainnet-1", height: 33206 },
      { name: "mainnet-2", height: 33210 },
      { name: "mainnet-3", height: 33210 },
      { name: "mainnet-4", height: 33210 },
      { name: "mainnet-5", height: 33210 },
      { name: "mainnet-6", height: 33210 },
      { name: "mainnet-7", height: 33210 },
      { name: "mainnet-8", height: 33210 },
      { name: "mainnet-9", height: 33210 },
      { name: "mainnet-10", height: 33210 },
      { name: "mainnet-11", height: 33210 },
      { name: "mainnet-12", height: 33210 },
    ],
  },
  {
    host: "pocket-2b",
    nodes: [
      { name: "peer-2", height: 33210 },
      { name: "mainnet-13", height: 33210 },
      { name: "mainnet-14", height: 33210 },
      { name: "mainnet-15", height: 33210 },
      { name: "mainnet-16", height: 33203 },
      { name: "mainnet-17", height: 33210 },
      { name: "mainnet-18", height: 33210 },
      { name: "mainnet-19", height: 33210 },
      { name: "mainnet-20", height: 33210 },
      { name: "mainnet-21", height: 33210 },
      { name: "mainnet-22", height: 33210 },
      { name: "mainnet-23", height: 33210 },
      { name: "mainnet-24", height: 33210 },
    ],
  },
];

test.skip("can compute best case block number", async () => {
  const response = await health.getAvaHealth(`http://10.0.0.149:9650`);
  expect(1).toEqual(1);
});

test.only("can get health from pocket nodes", async () => {
  // const { pocketNodes } = await discover.getNodes();

  //console.log(pocketNodes);

  // const response = await health.computePocketResults({
  //   readings: mockResults,
  // });

  const response = await health.getHighestPocketHeight(mockResults);

  // const response = await health.getPocketHealth(pocketNodes);

  console.log(response);
  expect(1).toEqual(1);
});
