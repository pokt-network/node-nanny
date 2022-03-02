module.exports = {
  apps: [
    {
      name: "agent",
      script: "./packages/agent/dist/server.js",
    },
    {
      name: "graphql-api",
      script: "./packages/api/dist/graphql/server.js",
    },
    {
      name: "event-consumer",
      script: "./packages/event-consumer/dist/index.js",
    },
    {
      name: "monitor",
      script: "./packages/monitor/dist/index.js",
    },
    {
      name: "ui",
      cwd: "./packages/ui",
      script: "npm",
      args: "start",
    },
  ],
};
