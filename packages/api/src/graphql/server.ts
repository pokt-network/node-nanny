import { ApolloServer } from "apollo-server";
import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";

import resolvers from "./resolvers";
import typeDefs from "./schema";

(async (): Promise<void> => {
  console.log(`GraphQL server starting up ...`);

  await connect();
  console.log(`MongoDB connection established ...`);

  const hostname = process.env.HOSTNAME || "localhost";
  const port = process.env.API_PORT || 4000;
  const uiPort = process.env.UI_PORT || 3000;
  const cors = {
    origin: `http://${hostname}:${uiPort}`,
    credentials: true,
  };

  const { url } = await new ApolloServer({ typeDefs, resolvers, cors }).listen({
    hostname,
    port,
  });
  console.log(`🚀 GraphQL server ready at ${url}`);
})();

process.on("SIGINT", function () {
  disconnect();
});
