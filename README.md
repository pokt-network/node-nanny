# Pocket Network | Node Nanny

**Currently in open beta**

A monitoring system that automates blockchain availability and alerts
for critical events that may require manual intervention by the node runner.

# Table of contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [How To Use](#how-to-use)
   1. [Adding Data](#adding-data)

# Overview

Node Nanny will perform periodic health checks on all nodes entered into the inventory database.

The application is composed of the following main components:

- Monitor - Performs periodic health checks on node inventory
- Event Consumer - Handles the automation and alerting in response to health events
- API - GraphQL API that services the user interface for handling the inventory DB
- User Interface - React app to handle inventory and logs

## Currently Supported Technologies

The application is currently opinionated and works with the following technologies:

- Load Balancer: [HAProxy](http://www.haproxy.org/)
- Alerting: [Discord](https://discord.com/developers/docs/intro)
- Logging: [Winston](https://github.com/winstonjs/winston)
  - [MongoDB](https://www.npmjs.com/package/winston-mongodb)
  - [Datadog](https://docs.datadoghq.com/logs/log_collection/nodejs/?tab=winston30)

Pull requests to support additional technologies are welcome.

# Installation

### 1. Setup Discord

Monitor alerts are sent to a Discord channel. In order to receive alerts, you will need a Discord server as well as a bot that can create channels in that server.

[If you don't have a Discord Server you will have to create one.](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-)

Take note of your server's ID, which you can find in `Server Settings > Widget`.

[Now, create a bot application...](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) _(make sure to save your bot's token as once this token is generated it cannot be viewed again.)_

[...and add it to your server.](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)

The bot will need the following permissions:

- `Manage Channels`
- `Manage Webhooks`

### 2. Set Environment Variables

On your chosen host, you will have to set the following environment variables in either a `.env` file in same location as your `docker-compose.yml` file or in your shell environment.

## [Example .env](.env.example)

### 3. Setup Docker Compose

[First ensure Docker Compose is installed on your host machine.](https://docs.docker.com/compose/install/)

## [Example Docker Compose](docker-compose.yml)

Ensure the filepath `/data/db` exists on your machine; this is where your inventory database will be located. Otherwise, if you would like to use a directory other than `/data/db` for your database location, you must set the `nn_db.volumes` property to the path you would like to store your inventory DB and logs.

Then, run `docker-compose up -d` from the same directory as this file. This will pull down the latest Node Nanny images, as well as setup the MongoDB and Redis containers and start everything up.

You are now ready to start adding inventory data. The Node Nanny UI will be available on port 3000 on your host machine; it is highly recommended to configure your access settings to prevent access from unauthorized IPs.

# How To Use

## Adding Data

Node Nanny supports adding Host and Node data through the included UI; either one at a time via form input or as batches using CSV upload.

### 1. Chains/Oracles

Both Chains and Oracles are autopopulated to the database on initialization of the application and updated on an hourly basis from a database maintained by Pocket. There is no need to manually create Chains or Oracles in the inventory database.

### 2. Locations

Locations are added on the Hosts screen; all that's needed is to add a string code. This code can be whatever you want but it must be unique.

### 3. Hosts

Hosts can be added on the Hosts screen, either by form input or in batches by CSV.

| field        | type    | required |
| ------------ | ------- | -------- |
| name         | string  | Y        |
| location     | string  | Y        |
| loadBalancer | boolean | Y        |
| ip           | string  |          |
| fqdn         | string  |          |

Notes

- Either IP or FQDN is required for each host, but cannot enter both.
- FQDN is required if the nodes on the host wish to use HTTPS.

#### Example CSV Format

| name      | location | loadBalancer | ip          | fqdn                             |
| --------- | -------- | ------------ | ----------- | -------------------------------- |
| eth-1-2a  | USW2     | false        | 12.43.5.123 |                                  |
| eth-1-2b  | USE2     | false        |             | eth-instance-2.nodes.eth.network |
| shared-2a | USE2     | true         | 10.0.0.33   |                                  |

Note: Location must exactly match a Location code that exists in your inventory database; the CSV import cannot be submitted otherwise.

### 4. Nodes

Nodes can be added on the Nodes screen, either by form input or in batches by CSV.

| field         | type         | required |
| ------------- | ------------ | -------- |
| https         | boolean      | Y        |
| chain         | string       | Y        |
| host          | string       | Y        |
| port          | number       | Y        |
| automation    | boolean      | Y        |
| backend       | string       |          |
| loadBalancers | string array |          |
| server        | string       |          |

Notes

- `https` may only be enabled if the Node's Host has an FQDN.
- `backend`, `loadBalancers` and `server` are required if `automation` is true.
- `backend` and `server` must match the fields defined in your `haproxy.cfg` file.
  - For further information in setting up HAProxy, see here.

#### Example CSV Format

| https | chain | host      | port | automation | backend    | loadBalancers       | server |
| ----- | ----- | --------- | ---- | ---------- | ---------- | ------------------- | ------ |
| false | ETH   | eth-1-2a  | 4001 | true       | ethmainnet | shared2a, shared-2b | 2a     |
| true  | ETH   | eth-1-2b  | 4230 | true       | ethmainnet | shared2a, shared-2b | 2b     |
| false | POKT  | pokt-1-1c | 5008 | false      |            |                     |        |

Notes

- `chain` & `host` must exactly match chain/hosts codes that exist in your inventory database; the CSV import cannot be submitted otherwise.
- `loadBalancers` is a list of load balancer host names comma separated and must also match host naems in your inventory database.
