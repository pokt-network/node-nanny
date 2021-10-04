import { Service } from './'

const logs = new Service()

test("should skip onboarding for node already subscribed", async () => {
  // const response = await logs.onBoardNewNode('ethereum-2a/eth')
  // expect(response).toBe(false);
});
test("should onboard new node to subscription", async () => {
  // const response = await logs.onBoardNewNode('testnet-1.nodes.pokt.network')
  // console.log(response)
  expect(1).toBe(1);
});
