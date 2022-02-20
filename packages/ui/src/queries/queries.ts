import { gql } from "@apollo/client";

export const GET_ALL_CHAINS = gql`
  query Chains {
    chains {
      id
      name
      type
    }
  }
`;

export const GET_ALL_HOSTS = gql`
  query Hosts {
    hosts {
      id
      name
      ip
      loadBalancer
      location
    }
  }
`;

export const GET_ALL_NODES = gql`
  query Nodes {
    nodes {
      id
      backend
      port
      server
      url
      variance
      ssl
      basicAuth
      loadBalancers
    }
  }
`;

export const GET_ALL_ORACLES = gql`
  query Oracles {
    oracles {
      id
      chain
      urls
    }
  }
`;

export const GET_ALL_WEBHOOKS = gql`
  query Webhooks {
    webhooks {
      id
      location
      chain
      url
    }
  }
`;

export const GET_HOSTS_CHAINS_LB = gql`
  query getHostsChainsAndLoadBalancers {
    hosts {
      id
      name
      ip
    }
    chains {
      id
      name
    }
    loadBalancers: hosts(loadBalancer: true) {
      id
      name
    }
  }
`;
