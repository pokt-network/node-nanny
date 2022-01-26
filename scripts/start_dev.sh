cd /home/ubuntu/node-nanny/packages/core && pnpm run build:watch
cd /home/ubuntu/node-nanny/packages/monitor && pnpm run build:watch
cd /home/ubuntu/node-nanny/packages/event-consumer && pnpm run build:watch


cd /home/ubuntu/node-nanny/packages/monitor && nodemon dist
cd /home/ubuntu/node-nanny/packages/event-consumer && nodemon dist
