import { Dispatch } from 'react';
import { ApolloQueryResult } from '@apollo/client';
import CSVReader from 'react-csv-reader';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

import { Title } from 'components';
import Paper from 'components/Paper';
import { ConfirmationModalProps } from 'components/modals/CSVConfirmationModal';
import { HostActionsState } from 'pages/Hosts';

import { IHostCsvInput, IHostsQuery, ILocation } from 'types';
import { ModalHelper, regexTest } from 'utils';

interface ICSVHost {
  name: string;
  location: string;
  loadBalancer?: string;
  ip?: string;
  fqdn?: string;
}

interface NodesCSVProps {
  locations: ILocation[];
  hostNames: string[];
  refetchHosts: (variables?: any) => Promise<ApolloQueryResult<IHostsQuery>>;
  setState: Dispatch<HostActionsState>;
}

export const HostsCSV = ({
  locations,
  hostNames,
  refetchHosts,
  setState,
}: NodesCSVProps) => {
  /* ----- Table Options ---- */
  const columnsOrder = ['name', 'location', 'ip', 'fqdn', 'loadBalancer'];

  /* ----- CSV Validation ----- */
  const validLocations = locations?.map(({ name }) => name);

  const schema: { [key: string]: (value: string, host?: any) => string } = {
    name: (name) => {
      if (!name) return 'Name is required';
    },
    loadBalancer: (loadBalancer) => {
      if (
        loadBalancer.toLowerCase() !== 'false' &&
        loadBalancer.toLowerCase() !== 'true'
      ) {
        return 'loadBalancer must be true or false';
      }
    },
    location: (location) => {
      if (!location) return 'Location is required';
      if (!validLocations?.includes(location.toUpperCase())) {
        return `${location} is not a valid location`;
      }
    },
    ip: (ip, host) => {
      if (!ip && !host.fqdn) return 'ip/fqdn: Host must have either an IP or a FQDN';
      if (ip && host.fqdn) return 'Host may only have FQDN or IP, not both';
      if (ip && !regexTest(ip, 'ip')) return 'Not a valid IP';
    },
    fqdn: (fqdn, host) => {
      if (!fqdn && !host.ip) return 'ip/fqdn: Host must have either an IP or a FQDN';
      if (fqdn && host.ip) return 'Host may only have FQDN or IP, not both';
    },
  };

  const validateCsvHostInput = (
    host: any,
    schema: { [key: string]: (value: string, host?: any) => string },
  ) =>
    Object.keys(schema)
      .filter((key) => !!schema[key](host[key], host))
      .map((key) => `${key}: ${schema[key](host[key], host)}`);

  /* ----- CSV Parsing ----- */
  const parseHostsCsv = (hostsData: ICSVHost[]) => {
    const hostsWithRequiredFields = hostsData.filter((host) =>
      ['name', 'location'].every((key) => Object.keys(host).includes(key)),
    );

    const invalidHosts: any = [];

    const parsedHosts: IHostCsvInput[] = hostsWithRequiredFields.map((host: any) => {
      const invalidFields = validateCsvHostInput(host, schema);

      if (hostNames.includes(host.name)) {
        invalidFields.push(`name: Host name is already taken.`);
      }

      if (invalidFields.length) {
        invalidHosts.push(`[${host.name}]: ${invalidFields.join(', ')}`);
      }

      return {
        name: host.name,
        location: host.location,
        ip: host.ip || null,
        fqdn: host.fqdn || null,
        loadBalancer: Boolean(host.loadBalancer === 'true'),
      };
    });

    const modalProps: ConfirmationModalProps = {
      type: 'Host',
      data: parsedHosts,
      columnsOrder,
      refetch: refetchHosts,
      setState,
    };

    if (invalidHosts.length) {
      modalProps.dataError = invalidHosts.join('\n');
      handleOpenCSVConfirmationModal(modalProps);
    } else {
      handleOpenCSVConfirmationModal(modalProps);
    }
  };

  const handleOpenCSVConfirmationModal = (modalProps: ConfirmationModalProps) => {
    ModalHelper.open({
      modalType: 'csvConfirmation',
      modalProps,
    });
  };

  /* ----- Layout ----- */
  return (
    <Paper>
      {!locations?.length && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          <AlertTitle>No Locations in Inventory Database</AlertTitle>
          Before creating a host, you must enter at least one location using the Edit
          Locations form.
        </Alert>
      )}
      <Title>Upload Hosts CSV</Title>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <CSVReader
          onFileLoaded={parseHostsCsv}
          parserOptions={{ header: true }}
          disabled={!locations?.length}
        />
        <Button
          onClick={() => setState(HostActionsState.Info)}
          color="error"
          variant="outlined"
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
};

export default HostsCSV;
