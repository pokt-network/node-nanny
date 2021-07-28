import { Health } from "..";
import { Service } from "./service"
import { BlockHeightVariance } from "./types"
const health = new Service()

test("can compute best case block number", async () => {
  const readings = [9559063, 9559077, 9559075, 9558906]
  const response = health.getBestBlockHeight({ readings, variance: BlockHeightVariance.BSC })
  expect(response).toEqual(9559077)
})

const mockNodes =
  [
    {
      node: {
        name: 'shared-2a/bsc',
        chain: 'BSC',
        ip: '10.0.0.149',
        port: '8552'
      },
      peer: {
        name: 'shared-2b/bsc',
        chain: 'BSC',
        ip: '10.0.1.208',
        port: '8552'
      },
      external: [
        'https://bsc-dataseed.binance.org',
        '***REMOVED***',
        'https://long-late-night.bsc.quiknode.pro',
        'https://bsc-dataseed1.defibit.io'
      ]
    },
    {
      node: {
        name: 'shared-2b/bsc',
        chain: 'BSC',
        ip: '10.0.1.208',
        port: '8552'
      },
      peer: {
        name: 'shared-2a/bsc',
        chain: 'BSC',
        ip: '10.0.0.149',
        port: '8552'
      },
      external: [
        'https://bsc-dataseed.binance.org',
        '***REMOVED***',
        'https://long-late-night.bsc.quiknode.pro',
        'https://bsc-dataseed1.defibit.io'
      ]
    }
  ]
