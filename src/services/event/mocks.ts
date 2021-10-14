import { BlockChainMonitorEvents, EventTransitions, EventTypes } from "./types";
import { INode, NodesModel, IHost, HostsModel } from "../../models";

const constructEvent = ({ id, event, transition, type, chain }) => {
    return {
        msg: '%%%\n' +
            '@webhook-events-dev \n' +
            `nodeId_${id}\n` +
            `event_${event}\n` +
            '\n' +
            '@webhook-events-production \n' +
            'chain_pokt\n' +
            'nodeId_615632b18b86f00010db487b\n' +
            'event_NOT_SYNCHRONIZED_NOT_RESOLVED\n' +
            '\n' +
            'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/shared-2a/poltst"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
            '\n' +
            'The monitor was last triggered at Mon Oct 04 2021 22:40:23 UTC.\n' +
            '\n' +
            '- - -\n' +
            '\n' +
            '[[Monitor Status](https://app.datadoghq.eu/monitors/2528963?to_ts=1633387223000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1633386323000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2528963/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1633387223000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1633386323000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fshared-2a%2Fpoltst%22)]',
        id: '2528963',
        transition,
        type,
        title: `[Re-Triggered on {@conditions:NOT_SYNCHRONIZED}] ${chain.name}`,
        status: '',
        link: 'https://app.datadoghq.eu/event/event?id=6192890666631275067'
    }
}


const events = [BlockChainMonitorEvents.OFFLINE]

const generateMockEvents = async () => {
    const nodes = await NodesModel.find({"chain.type": "POKT"}, null, {})

    console.log(nodes)
    const output = []
    for (const event of events) {
        for (const { _id, chain } of nodes) {
            const id = String(_id)
            output.push(constructEvent({
                chain, id, event, transition: EventTransitions.TRIGGERED, type: EventTypes.ERROR
            }))

            output.push(constructEvent({
                chain, id, event, transition: EventTransitions.RE_TRIGGERED, type: EventTypes.ERROR
            }))

            output.push(constructEvent({
                chain, id, event, transition: EventTransitions.RECOVERED, type: EventTypes.SUCCESS
            }))
        }
    }
    return output
}



export default generateMockEvents


