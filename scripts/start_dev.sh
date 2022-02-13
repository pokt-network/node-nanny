cd /home/jonathon/projects/node-nanny/packages/core && pnpm run build:watch
cd /home/jonathon/projects/node-nanny/packages/monitor && pnpm run build:watch
cd /home/jonathon/projects/node-nanny/packages/event-consumer && pnpm run build:watch
cd /home/jonathon/projects/node-nanny/packages/api && pnpm run build:watch

cd /home/jonathon/projects/node-nanny/packages/api && nodemon dist/graphql
cd /home/jonathon/projects/node-nanny/packages/monitor && nodemon dist
cd /home/jonathon/projects/node-nanny/packages/event-consumer && nodemon dist
