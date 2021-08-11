import { Service } from "./service";
import { Source } from "./types";

const discover = new Service({ source: Source.TAG });

test("should fetch pocket nodes and peers", async () => {
 const nodes = await discover.getPocketNodes()
 expect(Array.isArray(nodes)).toBe(true);
 expect(nodes[0]).toHaveProperty("host");
 expect(nodes[0]).toHaveProperty("nodes");
 expect(nodes[0].nodes.length).toBeGreaterThan(2)
});
