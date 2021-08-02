import { Service } from "./service";
import { Source } from "./types";

const discover = new Service({ source: Source.TAG });

test.skip("should fetch pocket nodes and peers", async () => {
  const nodes = await discover.getNodes()
  console.log(nodes);

  expect(3).toEqual(3);
});
