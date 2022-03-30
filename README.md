# Pocket Network | Node Nanny

Monitoring system for PNF internal nodes and associated infrastructure

## Installation

### [Node Nanny Docker Image](https://hub.docker.com/repository/docker/pocketfoundation/node-nanny)

Before pulling the Docker image a number of steps are required.

### 1. Setup Discord

Monitor alerts are sent to a Discord channel. In order to receive alerts, you will need a Discord server as well as a bot that can create channels in that server.

[If you don't have a Discord Server you will have to create one.](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-)

Take note of your server's ID, which you can find in `Server Settings > Widget`.

[Now, create a bot application on your server.](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)

[Access the Discord Developer Portal](https://discord.com/developers/applications) and set your bot's scope and permissions:

Scopes

- `bot`
- `applications.commands`

Permissions

- `Manage Channels`
- `Manage Webhooks`

The last step is to take note of your bots token, in `Bot` on the left panel. Once generated it cannot be viewed again so save the token at this step.

### 2. Set Environment Variables

On your chosen host, you will have to configure the environment variables in your shell environment. Add the following variables to your shell configuration file (`.bashrc` or `.zshrc`).

- ex. **EXPORT DISCORD_SERVER_ID="3r34fub78fjf239fhdsfs"**

#### Required Variables

- **DISCORD_SERVER_ID** - The server ID for the server you wish to receive alerts in.
- **DISCORD_TOKEN** - The secret token for your server's got application.

#### Optional Variables

- **MONGO_USER** - The user that will be used for your inventory database.
  **Defaults to `root`**
- **MONGO_PASSWORD** - The password that will be used for your database. **Defaults to `rootpassword`**
- **MONGO_DB_NAME** - The name of the database that will be used for your inventory. **Defaults to `local`**

### 3. Setup Docker Compose

[First install Docker Compose on your host machine.](https://docs.docker.com/compose/install/)

Then create a `docker-compose.yml` file with the following contents:

```
version: "3.7"
services:
  nn_stack:
    image: pocketfoundation/node-nanny:latest
    container_name: nn_stack
    ports:
      - "3000:3000"
      - "4000:4000"
    depends_on:
      - nn_db
      - nn_redis
    environment:
      MONITOR_LOGGER: mongodb
      MONGO_URI: "mongodb://${MONGO_USER:-root}:${MONGO_PASSWORD:-rootpassword}@nn_db:27017/${MONGO_DB_NAME:-local}?authSource=admin"
      DISCORD_SERVER_ID: ${DISCORD_SERVER_ID:?Discord Server ID not set.}
      DISCORD_TOKEN: ${DISCORD_TOKEN:?Discord token not set.}

  nn_db:
    image: mongo:latest
    container_name: nn_db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER:-root}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-rootpassword}
    volumes:
      - mongodb_data_container:/data/db

  nn_redis:
    image: "redis:latest"
    container_name: nn_redis

volumes:
  mongodb_data_container:
```

Then, run `docker-compose up -d` from the same directory as this file. This will pull down the latest None Nannyimage, as well as setup the DB and redis containers and start everything up. You are now ready to start adding inventory data.

## Adding Data
