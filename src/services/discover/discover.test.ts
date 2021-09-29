import { Service } from "./service";
import { Source } from "./types";
import { connect, disconnect } from "../../db"

const discover = new Service({ source: Source.TAG });

// test("should fetch pocket nodes and peers", async () => {
//     const nodes = await discover.getPocketNodes()
//     expect(Array.isArray(nodes)).toBe(true);
//     expect(nodes[0]).toHaveProperty("host");
//     expect(nodes[0]).toHaveProperty("nodes");
//     expect(nodes[0].nodes.length).toBeGreaterThan(2)
// });


// test('should get data nodes from multiple sources', async () => {
//     const  dataNodes  = await discover.getDataNodesfromCsv()

//     console.log(dataNodes)

//     expect(dataNodes[0]).toHaveProperty('node')
//     expect(dataNodes[0].node).toHaveProperty('name')
//     expect(dataNodes[0].node).toHaveProperty('chain')
//     expect(dataNodes[0].node).toHaveProperty('ip')
//     expect(dataNodes[0].node).toHaveProperty('port')

//     expect(dataNodes[0]).toHaveProperty('peer')
//     expect(dataNodes[0].node).toHaveProperty('name')
//     expect(dataNodes[0].node).toHaveProperty('chain')
//     expect(dataNodes[0].node).toHaveProperty('ip')
//     expect(dataNodes[0].node).toHaveProperty('port')
//     expect(dataNodes[0]).toHaveProperty('external')
//     expect(Array.isArray(dataNodes[0].external)).toBe(true)
// })


beforeAll(async () => {
    await connect()
})

afterAll(async () => {
    await disconnect()
})
test('should get nodes list from db', async () => {
    const nodes = await discover.getNodesfromDB()
    expect(nodes[0]).toHaveProperty('chain')
    expect(nodes[0]).toHaveProperty('port')
    expect(nodes[0]).toHaveProperty('host')
})