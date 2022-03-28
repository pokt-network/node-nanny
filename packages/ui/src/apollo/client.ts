import { ApolloClient, InMemoryCache } from "@apollo/client";
import { IPaginatedLogs } from "../types";

export default new ApolloClient({
  uri: "http://localhost:4000",
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
