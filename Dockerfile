FROM node:16

WORKDIR /usr/src/node-nanny
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY ./pnpm-*.yaml ./

RUN pnpm fetch

ADD . ./
RUN pnpm install pm2 redis -g
RUN pnpm install -r --offline
# RUN turbo run build

EXPOSE 3000
CMD ["pm2-runtime", "process.yml"]