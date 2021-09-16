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


test('should get data nodes from multiple sources', async () => {
    const  dataNodes  = await discover.getDataNodesfromCsv()

    console.log(dataNodes)

    expect(dataNodes[0]).toHaveProperty('node')
    expect(dataNodes[0].node).toHaveProperty('name')
    expect(dataNodes[0].node).toHaveProperty('chain')
    expect(dataNodes[0].node).toHaveProperty('ip')
    expect(dataNodes[0].node).toHaveProperty('port')

    expect(dataNodes[0]).toHaveProperty('peer')
    expect(dataNodes[0].node).toHaveProperty('name')
    expect(dataNodes[0].node).toHaveProperty('chain')
    expect(dataNodes[0].node).toHaveProperty('ip')
    expect(dataNodes[0].node).toHaveProperty('port')
    expect(dataNodes[0]).toHaveProperty('external')
    expect(Array.isArray(dataNodes[0].external)).toBe(true)
})