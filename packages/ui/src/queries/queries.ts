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
