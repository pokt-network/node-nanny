import { ApolloServer } from "apollo-server";
import { connect } from "@pokt-foundation/node-monitoring-core/dist/db";
import { config } from "dotenv";

import resolvers from "graphql/resolvers";
import typeDefs from "graphql/schema";

config();

(async (): Promise<void> => {
  console.log(`GraphQL server starting up ...`);

  await connect();
  console.log(`MongoDB connection established ...`);

  const { url } = await new ApolloServer({ typeDefs, resolvers }).listen();
  console.log(`🚀  GraphQL server ready at ${url}`);
})();
