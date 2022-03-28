import { ApolloServer } from "apollo-server";
import { connect, disconnect } from "@pokt-foundation/node-monitoring-core/dist/db";

import resolvers from "./resolvers";
import typeDefs from "./schema";

(async (): Promise<void> => {
  console.log(`GraphQL server starting up ...`);

  await connect();
  console.log(`MongoDB connection established ...`);

  const { url } = await new ApolloServer({ typeDefs, resolvers }).listen({ port: 4000 });
  console.log(`🚀 GraphQL server ready at ${url}`);
})();

process.on("SIGINT", function () {
  disconnect();
});
