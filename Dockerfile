FROM ubuntu:20.04

WORKDIR /usr/src/node-nanny

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get -y install nodejs
RUN apt-get -y install netcat
RUN curl -f https://get.pnpm.io/v6.32.3.js | node - add --global pnpm

COPY ./pnpm-*.yaml ./

RUN pnpm fetch

COPY . ./
RUN pnpm install pm2 turbo -g
RUN pnpm install -r --offline
RUN pnpm build

EXPOSE 3000
CMD ["pm2-runtime", "process.yml"] 