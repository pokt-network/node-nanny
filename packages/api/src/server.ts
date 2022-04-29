import { ApolloServer } from "apollo-server";
import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";
import env from "@pokt-foundation/node-nanny-core/dist/environment";

import resolvers from "./resolvers";
import typeDefs from "./schema";

(async (): Promise<void> => {
  console.log(`GraphQL server starting up ...`);

  await connect();
  console.log(`MongoDB connection established ...`);

  const cors = { origin: true, credentials: true };
  const port = env("BACKEND_PORT");
  await new ApolloServer({ typeDefs, resolvers, cors }).listen({ port });
  console.log(`🚀 GraphQL server listening on ${port}`);
})();

process.on("SIGINT", async function () {
  await disconnect();
});
