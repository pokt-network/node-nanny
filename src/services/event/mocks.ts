import { BlockChainMonitorEvents, EventTransitions, EventTypes } from "./types";

const constructEvent = ({ chain, host, container, backend, event, transition, type, name }) => {
    return {
        msg: '%%%\n' +
            '@webhook-Events_Dev\n' +
            `chain_${chain}\n` +
            `host_${host}\n` +
            `container_${container}\n` +
            `backend_${backend}\n` +
            `event_${event}\n` +
            '\n' +
            '@webhook-Events_Dev\n' +
            'chain_bsc\n' +
            'host_2b\n' +
            'container_null\n' +
            'backend_bscmainnet\n' +
            'event_NOT_SYNCHRONIZED_NOT_RESOLVED\n' +
            '\n' +
            'More than **4** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/binance-2b/bsc"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fbinance-2b%2Fbsc%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
            '\n' +
            'The monitor was last triggered at Tue Sep 07 2021 17:38:30 UTC.\n' +
            '\n' +
            '- - -\n' +
            '\n' +
            '[[Monitor Status](https://app.datadoghq.eu/monitors/2096310?to_ts=1631036310000&group=%40conditions%3ANOT_SYNCHRONIZED&from_ts=1631035410000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2096310/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1631036310000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1631035410000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fbinance-2b%2Fbsc%22)]',
        id: "2098084",
        transition,
        type,
        title: `[${transition} on {@conditions:${event}}] ${name}`,
        status: '',
        link: 'https://app.datadoghq.eu/event/event?id=6153640146765780814'
    }
}



const nodes = [
    {
        name: "xDai Mainnet US-East-2 Host A",
        chain: "xdai",
        host: "2b",
        container: "dai1",
        backend: "daimainnet",
    },
    {
        name: "xDai Mainnet US-East-2 Host B",
        chain: "xdai",
        host: "2b",
        container: "dai1",
        backend: "daimainnet",
    },
    {
        name: "Polygon Mainnet US-East-2 Host A",
        chain: "pol",
        host: "2a",
        container: "pol1",
        backend: "polymainnet",
    },
    {
        name: "Polygon Mainnet US-East-2 Host B",
        chain: "pol",
        host: "2b",
        container: "pol1",
        backend: "polymainnet",
    },
    {
        name: "Fuse Mainnet US-East-2 Host A",
        chain: "fus",
        host: "2a",
        container: "fusa1",
        backend: "fusemainnet",
    },
    {
        name: "Fuse Mainnet US-East-2 Host B",
        chain: "fus",
        host: "2b",
        container: "fusa1",
        backend: "fusemainnet",
    },
    {
        name: "Ethereum Ropsten US-East-2 Host A",
        chain: "rop",
        host: "2a",
        container: "rop1",
        backend: "ethropsten",
    },
    {
        name: "Ethereum Ropsten US-East-2 Host B",
        chain: "rop",
        host: "2b",
        container: "rop1",
        backend: "ethropsten",
    },
    {
        name: "Ethereum Rinkeby US-East-2 Host A",
        chain: "rin",
        host: "2a",
        container: "rin1",
        backend: "ethrinkeby",
    },
    {
        name: "Ethereum Rinkeby US-East-2 Host B",
        chain: "rin",
        host: "2b",
        container: "rin1",
        backend: "ethrinkeby",
    },
    {
        name: "Ethereum Mainnet US-East-2 Host A",
        chain: "eth",
        host: "2a",
        container: "eri-rpc1",
        backend: "ethmainnet",
    },
    {
        name: "Ethereum Mainnet US-East-2 Host B",
        chain: "eth",
        host: "2b",
        container: "eri-rpc1",
        backend: "ethmainnet",
    },
    {
        id: "2098084",
        name: "Ethereum Kovan US-East-2 Host A",
        chain: "kov",
        host: "2a",
        container: "kov1",
        backend: "ethkovan",
    },
    {
        name: "Ethereum Kovan US-East-2 Host B",
        chain: "kov",
        host: "2b",
        container: "kov1",
        backend: "ethkovan",
    },
    {
        name: "Ethereum Goerli US-East-2 Host A",
        chain: "goe",
        host: "2a",
        container: "goe1",
        backend: "ethgoerli",
    },
    {
        id: "2098084",
        name: "Ethereum Goerli US-East-2 Host B",
        chain: "goe",
        host: "2b",
        container: "goe1",
        backend: "ethgoerli",
    },
    {
        id: "2098084",//"2096277",
        name: "Binance Smart Chain Archival US-East-2 Host A",
        chain: "bsc",
        host: "2a",
        container: "bsa1",
        backend: "bscmainnet",
    },
    {
        id: "2098084",//"2096310",
        name: "Binance Smart Chain Archival US-East-2 Host B",
        chain: "bsc",
        host: "2b",
        container: "bsa1",
        backend: "bscmainnet",
    },
    {
        name: "Avalanche US-East-2 Host A",
        chain: "ava",
        host: "2a",
        container: "ava1",
        backend: "avaxmainnet",
    },
    {
        name: "Avalanche US-East-2 Host B",
        chain: "ava",
        host: "2b",
        container: "ava1",
        backend: "avaxmainnet",
    }
]

const events = [BlockChainMonitorEvents.OFFLINE]


const generateMockEvents = () => {
    const output = []
    for (const event of events) {
        for (const { name, chain, host, container, backend, id } of nodes) {

            output.push(constructEvent({
                name, chain, host, container, backend, event, transition: EventTransitions.TRIGGERED, type: EventTypes.ERROR
            }))


            output.push(constructEvent({
                name, chain, host, container, backend, event, transition: EventTransitions.RE_TRIGGERED, type: EventTypes.ERROR
            }))


            output.push(constructEvent({
                name, chain, host, container, backend, event, transition: EventTransitions.RECOVERED, type: EventTypes.SUCCESS
            }))
        }
    }
    return output
}



export default generateMockEvents()


const newMock = {
    msg: '%%%\n' +
      '@webhook-events-production \n' +
      'nodeId_615632b18b86f00010db487b\n' +
      'event_NOT_SYNCHRONIZED"\n' +
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
    transition: 'Re-Triggered',
    type: 'error',
    title: '[Re-Triggered on {@conditions:NOT_SYNCHRONIZED}] SHARED-2A/POLTST',
    status: '',
    link: 'https://app.datadoghq.eu/event/event?id=6192890666631275067'
  }