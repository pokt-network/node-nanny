module.exports = {
  apps: [
    {
      name: "api",
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
      name: "updater",
      script: "./packages/core/dist/jobs/updater.js",
      restart_delay: 1000 * 60 * 60,
    },
    {
      name: "ui",
      cwd: "./packages/ui",
      script: "npm",
      args: "start",
    },
  ],
};
