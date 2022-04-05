import { ApolloServer } from "apollo-server";
import { connect, disconnect } from "@pokt-foundation/node-nanny-core/dist/db";

import resolvers from "./resolvers";
import typeDefs from "./schema";

(async (): Promise<void> => {
  console.log(`GraphQL server starting up ...`);

  await connect();
  console.log(`MongoDB connection established ...`);

  const backendHost = process.env.BACKEND_HOST || "localhost";
  const frontendHost = process.env.FRONTEND_HOST || "localhost";
  const port = process.env.API_PORT || 4000;
  const uiPort = process.env.PORT || 3000;
  const cors = {
    origin: "*",
    // origin: `http://${frontendHost}:${uiPort}`,
    credentials: true,
  };

  await new ApolloServer({ typeDefs, resolvers, cors }).listen({
    frontendHost,
    port,
  });
  console.log(`🚀 GraphQL server ready at ${`http://${backendHost}:${port}`}`);
})();

process.on("SIGINT", function () {
  disconnect();
});
