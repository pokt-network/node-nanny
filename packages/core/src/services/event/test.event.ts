import { Service } from "./service";
import { config } from "dotenv";
import { wait } from "../../utils";
import { connect } from "../../db";

import mocks from './mocks'
config();

const event = new Service();

const run = async () => {
    await connect()
    const allMocks = await mocks()
    for (const mock of allMocks) {
       console.log(mock.title)
        await event.processEvent(mock)
        await wait(10000)
    }
}

run()