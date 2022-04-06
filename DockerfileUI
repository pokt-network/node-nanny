FROM node:16

WORKDIR /usr/src/node-nanny-ui

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY ./packages/ui ./

RUN pnpm install 

EXPOSE 3000
CMD ["pnpm", "serve"] 