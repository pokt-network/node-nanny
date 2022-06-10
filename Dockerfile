FROM ubuntu:20.04

WORKDIR /usr/src/node-nanny-backend

RUN apt-get update 
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    git \
    netcat
RUN curl -sL https://deb.nodesource.com/setup_16.x  | bash -
RUN apt-get install nodejs -y
RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm@6

COPY ./ .

RUN rm -rf ./packages/ui
RUN rm ./pnpm-lock.yaml
RUN find . -type f -name "*jest*" -delete
RUN find . -type f -name "*.test.*" -delete

RUN pnpm install pm2 turbo -g
RUN pnpm install 
RUN pnpm build
RUN npm set-script postinstall ""
RUN pnpm prune --production

EXPOSE 4000
CMD ["pm2-runtime", "process.yml"] 