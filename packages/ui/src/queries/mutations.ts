import { gql } from "@apollo/client";

export const CREATE_CHAIN = gql`
  mutation createChain($name: String!, $type: String!) {
    createChain(name: $name, type: $type) {
      name
      type
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
