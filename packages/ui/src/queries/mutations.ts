import { gql } from "@apollo/client";

export const CREATE_CHAIN = gql`
  mutation CreateChain($name: String!, $type: String!, $variance: Int) {
    createChain(name: $name, type: $type, variance: $variance) {
      name
      type
      variance
    }
  }
`;

export const CREATE_HOST = gql`
  mutation CreateHost(
    $name: String
    $ip: String
    $loadBalancer: Boolean
    $location: String
  ) {
    createHost(name: $name, ip: $ip, loadBalancer: $loadBalancer, location: $location) {
      name
      ip
      loadBalancer
    }
  }
`;

export const CREATE_NODE = gql`
  mutation CreateNode(
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
  mutation CreateOracle($chain: String, $url: String) {
    createOracle(chain: $chain, url: $url) {
      id
      urls
    }
  }
`;

export const CREATE_WEBHOOK = gql`
  mutation CreateWebhook($chain: String, $url: String, $location: String) {
    createWebhook(chain: $chain, url: $url, location: $location) {
      url
    }
  }
`;

export const REBOOT_SERVER = gql`
  mutation RebootServer($id: ID!) {
    rebootServer(id: $id)
  }
`;

export const ENABLE_HAPROXY = gql`
  mutation EnableHaProxyServer($id: ID!) {
    enableHaProxyServer(id: $id)
  }
`;

export const DISABLE_HAPROXY = gql`
  mutation DisableHaProxyServer($id: ID!) {
    disableHaProxyServer(id: $id)
  }
`;

export const MUTE_MONITOR = gql`
  mutation MuteMonitor($id: ID!) {
    muteMonitor(id: $id) {
      id
      muted
    }
  }
`;

export const UNMUTE_MONITOR = gql`
  mutation UnmuteMonitor($id: ID!) {
    unmuteMonitor(id: $id) {
      id
      muted
    }
  }
`;
