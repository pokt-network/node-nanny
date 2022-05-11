import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertTitle, Grid, LinearProgress } from '@mui/material';

import { Table } from 'components';
import {
  IChain,
  IOracle,
  useLocationsQuery,
  useChainsQuery,
  useOraclesQuery,
  IHostsQuery,
} from 'types';
import { PNFInventory } from 'components/PNF/PNFInventory';
import HostCRUD from 'components/Hosts/HostCRUD';
import HostsCSV from 'components/Hosts/HostsCSV';
import HostLocation from 'components/Hosts/HostLocation';

export enum PNFTypeState {
  Chains = 'chains',
  Oracles = 'oracles',
}
export enum PNFActionsState {
  Info = 'info',
  Create = 'create',
  Edit = 'edit',
  Upload = 'upload',
}

export function PNF() {
  const [selectedItem, setSelectedItem] = useState<IChain | IOracle>(undefined);
  const [typeState, setTypeState] = useState<PNFTypeState>(PNFTypeState.Chains);
  const [state, setState] = useState<PNFActionsState>(PNFActionsState.Info);

  const {
    data: chainsData,
    loading: chainsLoading,
    error: chainsError,
    refetch: refetchChains,
  } = useChainsQuery();
  const {
    data: oraclesData,
    loading: oraclesLoading,
    error: oraclesError,
    refetch: refetchOracles,
  } = useOraclesQuery();

  /* ----- Table Options ---- */
  // const filterOptions = {
  //   filters: ['All', 'Load Balancer', 'IP', 'FQDN'],
  //   filterFunctions: {
  //     'Load Balancer': ({ loadBalancer }: IHost) => Boolean(loadBalancer),
  //     IP: ({ ip }: IHost) => Boolean(ip),
  //     FQDN: ({ fqdn }: IHost) => Boolean(fqdn),
  //   },
  // };
  // const columnsOrder = ['name', 'location', 'loadBalancer', 'nodes'];
  // const hostNames = data?.hosts.map(({ name }) => name);

  // const hostsWithNode: { [id: string]: number } = useMemo(() => {
  //   return nodesData?.nodes?.reduce(
  //     (list: { [id: string]: number }, { host: { id } }) => ({
  //       ...list,
  //       [id]: (list[id] || 0) + 1,
  //     }),
  //     {},
  //   );
  // }, [nodesData?.nodes]);
  // const locationsWithHost: { [id: string]: number } = useMemo(
  //   () =>
  //     data?.hosts?.reduce(
  //       (list: { [id: string]: number }, { location: { id } }) => ({
  //         ...list,
  //         [id]: (list[id] || 0) + 1,
  //       }),
  //       {},
  //     ),
  //   [data?.hosts],
  // );

  // const handleSelectedHost = (host: IHostsQuery['hosts'][0]) => {
  //   setState(HostActionsState.Info);
  //   setSelectedHost(host);
  // };

  /* ----- Layout ----- */
  if (chainsLoading || oraclesLoading) return <LinearProgress />;
  if (chainsError || oraclesError)
    return (
      <>
        <Alert severity="error">
          <AlertTitle>{'Error fetching data: '}</AlertTitle>
          {(chainsError || oraclesError).message}
        </Alert>
      </>
    );

  if (chainsData && oraclesData) {
    return (
      <>
        <PNFInventory
          chains={chainsData.chains}
          oracles={oraclesData.oracles}
          typeState={typeState}
          setState={setState}
          setTypeState={setTypeState}
        />
        {/* <Grid container spacing={{ sm: 0, lg: 4 }}>
          {(state === 'info' || state === 'create' || state === 'edit') && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostCRUD
                host={selectedHost}
                hostsWithNode={hostsWithNode}
                setSelectedHost={setSelectedHost}
                type={state}
                locations={locationsData.locations}
                hostNames={hostNames}
                setState={setState}
                refetch={refetch}
              />
            </Grid>
          )}
          {state === 'upload' && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostsCSV
                locations={locationsData?.locations}
                hostNames={hostNames}
                setState={setState}
                refetchHosts={refetch}
              ></HostsCSV>
            </Grid>
          )}
          {state === 'location' && (
            <Grid item sm={12} lg={6} order={{ lg: 2 }}>
              <HostLocation
                locations={locationsData?.locations}
                locationsWithHost={locationsWithHost}
                refetchLocations={refetchLocations}
                setState={setState}
              />
            </Grid>
          )}
          <Grid item sm={12} lg={6} order={{ lg: 1 }}>
            <Table<IHost>
              type="Host"
              searchable
              paginate
              filterOptions={filterOptions}
              columnsOrder={columnsOrder}
              numPerPage={10}
              rows={data.hosts.map((host) => ({
                ...host,
                nodes: hostsWithNode[host.id] || 0,
              }))}
              mapDisplay={(host: IHost) => ({
                ...host,
                location: host.location.name,
                nodes: hostsWithNode[host.id] || 0,
              })}
              selectedRow={selectedHost?.id}
              onSelectRow={handleSelectedHost}
            />
          </Grid>
        </Grid> */}
      </>
    );
  }

  return <></>;
}
