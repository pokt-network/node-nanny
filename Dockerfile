FROM ubuntu:20.04

WORKDIR /usr/src/node-nanny

RUN apt-get update
RUN apt-get -y install git
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get -y install nodejs
RUN apt-get -y install netcat
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

COPY ./pnpm-*.yaml ./

RUN pnpm fetch

COPY . ./
RUN pnpm install pm2 turbo -g
RUN pnpm install -r --offline
RUN pnpm build
RUN node ./packages/core/dist/jobs/init-db.js

EXPOSE 3000
EXPOSE 4000
CMD ["pm2-runtime", "process.yml"] 