import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { IPaginatedLogs } from "../types";

const hostname = process.env.REACT_APP_BACKEND_HOST || window.location.hostname;
const uri = `http://${hostname}:4000`;

export default new ApolloClient({
  link: createHttpLink({ uri, credentials: "include" }),
  cache: new InMemoryCache({
    addTypename: true,
    typePolicies: {
      Query: {
        fields: {
          logs: {
            keyArgs: false,
            /* Merge new Logs into cache when fetching paginated logs for infinite scrolling LogTable */
            merge(
              existing: IPaginatedLogs = {
                docs: [],
                hasNextPage: false,
                hasPrevPage: false,
                limit: 0,
                page: 0,
                totalDocs: 0,
                totalPages: 0,
                pagingCounter: 0,
              },
              incoming: IPaginatedLogs,
            ) {
              return {
                ...incoming,
                docs: [...existing.docs, ...incoming.docs].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
                ),
              };
            },
          },
        },
      },
    },
  }),
});
