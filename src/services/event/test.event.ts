import { Service } from "./service";
import { config } from "dotenv";
import { wait } from "../../utils";
import mocks from './mocks'
config();

const event = new Service();

const run = async () => {
    for (const mock of mocks) {
        console.log(mock.title)
        await event.processEvent(mock)
        await wait(10000)
    }
}

run()