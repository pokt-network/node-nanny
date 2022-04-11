# Pocket Network | Node Nanny

Monitoring system for PNF internal nodes and associated infrastructure

## Installation

### [Node Nanny Docker Image](https://hub.docker.com/repository/docker/pocketfoundation/node-nanny)

Before pulling the Docker image a number of steps are required.

### 1. Setup Discord

Monitor alerts are sent to a Discord channel. In order to receive alerts, you will need a Discord server as well as a bot that can create channels in that server.

[If you don't have a Discord Server you will have to create one.](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-)

Take note of your server's ID, which you can find in `Server Settings > Widget`.

[Now, create a bot application...](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) _(make sure to save your bot's token as once this token is generated it cannot be viewed again.)_

[...and add it to your server.](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)

The bot will need the following:

Scopes

- `bot`
- `applications.commands`

Permissions

- `Manage Channels`
- `Manage Webhooks`

### 2. Set Environment Variables

On your chosen host, you will have to set the following environment variables in either a `.env` file in same location as your `docker-compose.yml` file or in your shell environment.

#### Required Variables

- **DISCORD_SERVER_ID** - The server ID for the server you wish to receive alerts in.
- **DISCORD_TOKEN** - The secret token for your server's bot application.
- **MONGO_USER** - The user that will be used for your inventory database.
- **MONGO_PASSWORD** - The password that will be used for your inventory database.
- **MONGO_DATABASE** - The name of the inventory database.

#### Optional Variables

- **ALERT_TRIGGER_THRESHOLD** - The number of times a health check should fail before triggering. **Defaults to `6`**
- **ALERT_RETRIGGER_THRESHOLD** - The number of times a health check should fail before retriggering. **Defaults to `60`**
- **FRONTEND_PORT** - The port the React UI will run on. **Defaults to `3000`**
- **BACKEND_HOST** - If the backend is hosted on a different host than the UI, this variable will need to be set to the hostname.

### 3. Setup Docker Compose

[First install Docker Compose on your host machine.](https://docs.docker.com/compose/install/)

Then create a `docker-compose.yml` file with the following contents:

```
version: "3.7"
services:
  nn_backend:
    image: pocketfoundation/node-nanny:latest
    container_name: nn_backend
    ports:
      - "4000:4000"
    hostname: nn_backend
    depends_on:
      - nn_db
      - nn_redis
    environment:
      # Hardcoded Docker Compose vars
      REDIS_HOST: nn_redis

      # Required Environment Variables
      DISCORD_SERVER_ID: ${DISCORD_SERVER_ID:?Discord Server ID not set.}
      DISCORD_TOKEN: ${DISCORD_TOKEN:?Discord token not set.}

      # Optional Environment Variables
      ALERT_TRIGGER_THRESHOLD: ${ALERT_TRIGGER_THRESHOLD}
      ALERT_RETRIGGER_THRESHOLD: ${ALERT_RETRIGGER_THRESHOLD}
      MONITOR_LOGGER: ${MONITOR_LOGGER:-mongodb}

      MONGO_URI: "mongodb://${MONGO_USER:?Mongo user not set.}:${MONGO_PASSWORD:?Mongo password not set.}@nn_db:27017/${MONGO_DATABASE:?Mongo database name not set.}?authSource=admin"

  nn_frontend:
    image: pocketfoundation/node-nanny-ui:latest
    container_name: nn_frontend
    ports:
      - "3000:3000"
    hostname: nn_frontend
    depends_on:
      - nn_backend
      - nn_db
      - nn_redis

  nn_db:
    image: mongo:latest
    container_name: nn_db
    environment:
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE:?Mongo database name not set.}
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:?Mongo user not set.}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:?Mongo password not set.}
    volumes:
      - /data/db:/data/db
    ports:
      - "27017:27017"

  nn_redis:
    image: "redis:latest"
    container_name: nn_redis
```

Set the `nn_db.volumes` property to the path you would like to store your inventory DB and logs.

Then, run `docker-compose up -d` from the same directory as this file. This will pull down the latest Node Nanny images, as well as setup the MongoDB and Redis containers and start everything up. You are now ready to start adding inventory data.

## Adding Data
