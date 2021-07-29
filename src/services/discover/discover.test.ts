import { Service } from './service'
import { Source } from './types'

const discover = new Service({ source: Source.TAG })

test("A and B should have the same number of entries", async () => {
  ///const nodes = await discover.getNodes()
  //console.log(nodes)
  //expect(1).toEqual(1)
});


