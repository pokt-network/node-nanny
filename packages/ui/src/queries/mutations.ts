import { gql } from "@apollo/client";

export const CREATE_CHAIN = gql`
  mutation createChain($name: String!, $type: String!, $variance: Int) {
    createChain(name: $name, type: $type, variance: $variance) {
      name
      type
      variance
    }
  }
`;

export const CREATE_HOST = gql`
  mutation createHost($name: String, $ip: String, $loadBalancer: Boolean, $location: String) {
    createHost(name: $name, ip: $ip, loadBalancer: $loadBalancer, location: $location) {
      name
      ip
      loadBalancer
    }
  }
`;

export const CREATE_NODE = gql`
  mutation createNode(
    $backend: String
    $chain: ID
    $haProxy: Boolean
    $host: ID
    $port: Int
    $server: String
    $ssl: Boolean
    $url: String
    $loadBalancers: [ID]
  ) {
    createNode(
      input: {
        backend: $backend
        chain: $chain
        haProxy: $haProxy
        host: $host
        port: $port
        server: $server
        ssl: $ssl
        url: $url
        loadBalancers: $loadBalancers
      }
    ) {
      id
      url
    }
  }
`;

export const CREATE_ORACLE = gql`
  mutation createOracle($chain: String, $url: String) {
    createOracle(chain: $chain, url: $url) {
      id
      urls
    }
  }
`;

export const CREATE_WEBHOOK = gql`
  mutation ($chain: String, $url: String, $location: String) {
    createWebhook(chain: $chain, url: $url, location: $location) {
      url
    }
  }
`;
