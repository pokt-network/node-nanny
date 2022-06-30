<div align="center">
<a href="https://www.pokt.network">
    <img src=".github/Icon.svg" alt="Pocket Network logo" width="200"/>
  </a>
  <h1>Pocket Node Nanny</h1>
</div>

Babysits your nodes, so you don't have to. 🧸

### **Currently in open beta**

[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors)

<div>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg"/></a>
    <a href="https://github.com/pokt-foundation/node-nanny/pulse"><img src="https://img.shields.io/github/last-commit/pokt-foundation/node-nanny.svg"/></a>
    <a href="https://github.com/pokt-foundation/node-nanny/pulls"><img src="https://img.shields.io/github/issues-pr/pokt-foundation/node-nanny.svg"/></a>
    <a href="https://github.com/pokt-foundation/node-nanny/issues"><img src="https://img.shields.io/github/issues-closed/pokt-foundation/node-nanny.svg"/></a>
</div>

# Table of contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [How To Use](#how-to-use)
   1. [Adding Data](#adding-data)
   2. [Automation](#automation)
4. [Support and Contact](#support-and-contact)
5. [License](#license)

# Overview

Node Nanny is a node monitoring system for automating the availability of Pocket blockchain nodes.

It uses an inventory database to perform periodic node health checks. Out of sync nodes are automatically prevented from receiving traffic by removing them from load balancer rotation.

In order for this automation functionality to work, HAProxy will need to be configured to handle routing traffic to your nodes _[(more details)](#automation)_.

Without HAProxy configured, Node Nanny can still provide real time node health monitoring; however the main benefit of this application to node runners lies in its ability to automatically add and remove nodes from rotation as they go in and out of sync.

## Architecture

The application is composed of the following main components:

- `Monitor` - Performs periodic health checks on node inventory
- `Event Consumer` - Handles the automation and alerting in response to health events
- `API` - GraphQL API that services the user interface for handling the inventory DB
- `User Interface` - React app to handle inventory and logs

## Supported Technologies

The application currently works with the following technologies:

- Load Balancer: [HAProxy](http://www.haproxy.org/)
- Alerting: [Discord](https://discord.com/developers/docs/intro)
- Logging: [Winston](https://github.com/winstonjs/winston)

  Supported Log Transports

  - [MongoDB](https://www.npmjs.com/package/winston-mongodb)
  - [Datadog](https://docs.datadoghq.com/logs/log_collection/nodejs/?tab=winston30)

Pull requests to support additional technologies are welcome.

# Installation

### 1. Setup Discord

Monitor alerts are sent to a Discord channel. In order to receive alerts, you will need a Discord server as well as a bot that can create channels in that server.

- [If you don't have a Discord Server you will have to create one.](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server-) _(Take note of your server's ID, which you can find in `Server Settings > Widget`.)_

- [Create a bot application...](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) _(make sure to save your bot's token as once this token is generated it cannot be viewed again.)_

- [...and add it to your server.](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links)

The bot will need the following permissions:

- `Manage Channels`
- `Manage Webhooks`

### 2. Setup Docker Compose

[Ensure Docker Compose is installed on your host machine.](https://docs.docker.com/compose/install/)

**It is not necessary to pull the repo to run Node Nanny; all that is required are the `docker-compose.yml` and `.env` files.**

### **[Example Docker Compose File](docker-compose.yml)**

- Create a `docker-compose.yml` file with the above contents from the example file.

- _Database location: Ensure the filepath `/data/db` exists on your machine; this is where your inventory database will be located. If you would like to use a directory other than `/data/db` for your database location, you must set the `nn_db.volumes` property in the `docker-compose.yml` file to the path you would like to store your inventory DB and logs._

### 3. Set Environment Variables

### **[Example .env File](.env.example)**

- Set all required environment variables listed in the example file, in either a `.env` file in same location as your `docker-compose.yml` file or in your shell environment.

### 4. Start the App

- Then, run `docker-compose up -d` from the same directory as your `docker-compose.yml` file. This will pull down the latest Node Nanny images, as well as the MongoDB and Redis containers and start the Node Nanny application.

The Node Nanny UI will be available on port 3000 on your host machine.

**⚠️ You must configure your firewall/access control settings to prevent access from unauthorized IPs. ⚠️**

You are now ready to start adding inventory data.

# How To Use

## Adding Data

Host and Node inventory is stored in an included database; this inventory is merely a set of records for monitoring and automation purposes.

Node Nanny supports adding Host and Node data through the included UI; either one at a time via form input or as batches using CSV upload.
If using CSV upload, column headers are required in the CSV file.

## 1. Chains/Oracles

Both Chains and Oracles are autopopulated to the database on initialization of the application and updated every hour from a database maintained by Pocket. There is no need to manually create Chains or Oracles in the inventory database.

## 2. Locations

Locations are added on the Hosts screen; all that's needed is to add a string code. This code can be whatever you want but it must be unique.

## 3. Hosts

Hosts can be added on the Hosts screen, either by form input or in batches by CSV.

| field        | type    | required |
| ------------ | ------- | -------- |
| name         | string  | Y        |
| location     | string  | Y        |
| loadBalancer | boolean | Y        |
| ip           | string  |          |
| fqdn         | string  |          |

Notes

- `loadBalancer` indicates whether or not the host is running load balancer software; this field must be enabled in order to make the host available to a node as a load balancer.
- Either `IP` or `FQDN` is required for each host, but cannot enter both.
- `FQDN` is required if the nodes on the host wish to use HTTPS.

### Example CSV Format

| name      | location | loadBalancer | ip          | fqdn                             |
| --------- | -------- | ------------ | ----------- | -------------------------------- |
| eth-1-2a  | USW2     | false        | 12.43.5.123 |                                  |
| eth-1-2b  | USE2     | false        |             | eth-instance-2.nodes.eth.network |
| shared-2a | USE2     | true         | 10.0.0.33   |                                  |

Note: Location must exactly match a Location code that exists in your inventory database; the CSV import cannot be submitted otherwise.

## 4. Nodes

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
| basicauth     | string       |          |

Notes

- `https` may only be enabled if the Node's Host has an FQDN.
- `backend`, `loadBalancers` and `server` are required if `automation` is true.
- `backend` and `server` must match the fields defined in your `haproxy.cfg` file.
  - For further information on setting up HAProxy, including an example of where `backend` and`server` are defined, [see below](#automation).
- `basicAuth` is entirely optional, but if used, must follow the format <USERNAME>:<PASSWORD>

### Example CSV Format

| https | chain | host      | port | automation | backend    | loadBalancers       | server | basicAuth     |
| ----- | ----- | --------- | ---- | ---------- | ---------- | ------------------- | ------ | ------------- |
| false | ETH   | eth-1-2a  | 4001 | true       | ethmainnet | shared2a, shared-2b | 2a     |               |
| true  | ETH   | eth-1-2b  | 4230 | true       | ethmainnet | shared2a, shared-2b | 2b     |               |
| false | POKT  | pokt-1-1c | 5008 | false      |            |                     |        | user:password |

Notes

- `chain` & `host` must exactly match chain/host codes that exist in your inventory database; the CSV import cannot be submitted otherwise.
- `loadBalancers` is a list of load balancer host names comma separated and must also match host names in your inventory database.

## 5. Frontends

A frontend is a record of the host that is running your load balancer software for a given chain. Monitoring your frontend is a convenient way to ensure there is any service available for a given chain; if a health check cannot return a healthy response for any of the backends for a frontend it means there is no service available for that chain through the load balancer frontend.

| field     | type    | required |
| --------- | ------- | -------- |
| https     | boolean | Y        |
| chain     | string  | Y        |
| host      | string  | Y        |
| port      | number  | Y        |
| frontend  | string  | Y        |
| basicAuth | string  |          |

Notes

- `frontend` must match the field defined in your `haproxy.cfg` file.
  - For further information on setting up HAProxy, [see below](#automation).
- Only one frontend record may be created for a given host/chain combination, and only load balancer hosts may be selected.
- `basicAuth` is entirely optional, but if used, must follow the format <USERNAME>:<PASSWORD>

**CSV import of frontends is not supported.**

# Automation

Node Nanny automatically manages the availabilty of your blockchain nodes, pulling them in and out of rotation. This feature is only available on nodes configured to run through HAProxy.

**In order to use the automation feature, ensure port 9999 on your load balancer Host is open to Node Nanny's IP.**

## HAProxy

_Currently the only supported load balancer software is HAProxy; pull requests to support additional load balancers are welcome._

If you are not familiar with HAProxy, the following two guides should be helpful:

### 1. [HAProxy configuration basics guide](https://www.haproxy.com/blog/haproxy-configuration-basics-load-balance-your-servers/)

[![Getting Started with HAProxy Runtime API to Remove Backends for Maintenance Remotely](http://img.youtube.com/vi/JjXUH0VORnE/0.jpg)](https://www.youtube.com/watch?v=JjXUH0VORnE 'Getting Started with HAProxy Runtime API to Remove Backends for Maintenance Remotely')

### 2. [Getting Started with HAProxy Runtime API to Remove Backends for Maintenance Remotely](https://www.youtube.com/watch?v=JjXUH0VORnE)

### Example haproxy.cfg File

```
global
  stats socket /var/run/api.sock user haproxy group haproxy mode 660 level admin expose-fd listeners
  stats socket ipv4@*:9999  level admin  expose-fd listeners
  log stdout format raw local0 notice emerg

defaults
  mode http
  timeout client 120s
  timeout connect 5s
  timeout server 10s
  timeout http-request 120s
  log global

userlist credentials
   user nodenannyuser  password password1234

frontend stats
   bind *:8050
   stats enable
   stats uri /stats
   stats refresh 10s
   stats auth nodenannystats:password5678

frontend ethmainnet
 bind *:18545
 default_backend ethmainnet
 timeout client 120s
 timeout http-request 120s
 http-request auth unless { http_auth(credentials) }

# Backends
backend ethmainnet
 option httpchk
 balance leastconn
 mode http
 filter compression
 compression algo gzip
 timeout server 120s
 server  2a ethereum-use2a.pocketblockchains.com:8545 check resolve-prefer ipv4
```

_(This is intended to provide a general example only; exact configuration will vary based on your environment.)_

In the example above, there is one single Ethereum node configured to run through a single load balancer, defined on the final line.

The load balancer host and node records that correspond to this `haproxy.cfg` file would require the foillowing values in the associated inventory records:

#### Load Balancer Host

| name           | location | loadBalancer | ip  | fqdn                                 |
| -------------- | -------- | ------------ | --- | ------------------------------------ |
| ethereum-use2a | USE2     | true         |     | ethereum-use2a.pocketblockchains.com |

#### Load Balanced Node

| port | automation | backend    | loadBalancers  | server |
| ---- | ---------- | ---------- | -------------- | ------ |
| 8545 | true       | ethmainnet | ethereum-use2a | 2a     |

If desired, a frontend record could be created as follows:

#### Load Balancer Frontend

| host           | port  | frontend   | username      | password     |
| -------------- | ----- | ---------- | ------------- | ------------ |
| ethereum-use2a | 18545 | ethmainnet | nodenannyuser | 1234password |

### HAProxy Stats Page

In the example above, the HAProxy stats page is available on port `8050` with the credentials `nodenannystats:password5678` on the load balancer host. This page provides an easy to understand overview of the status of all backends on a given load balancer. In short, green nodes are healthy, red are offline and orange have been removed by Node Nanny due to being out of sync.

[For more info on the HAProxy stats page, click here.](https://www.haproxy.com/blog/exploring-the-haproxy-stats-page/)

# Support and Contact

### **Currently in open beta**

If you come across an issue with Node Nanny, do a search in the [Issues](https://github.com/pokt-foundation/node-nanny/issues) tab of this repo to make sure it hasn't been reported before. Follow these steps to help us prevent duplicate issues and unnecessary notifications going to the many people watching this repo:

- If the issue you found has been reported and is still open, and the details match your issue, give a "thumbs up" to the relevant posts in the issue thread to signal that you have the same issue. No further action is required on your part.
- If the issue you found has been reported and is still open, but the issue is missing some details, you can add a comment to the issue thread describing the additional details.
- If the issue you found has been reported but has been closed, you can comment on the closed issue thread and ask to have the issue reopened because you are still experiencing the issue. Alternatively, you can open a new issue, reference the closed issue by number or link, and state that you are still experiencing the issue. Provide any additional details in your post so we can better understand the issue and how to fix it.

<div>
  <a  href="https://twitter.com/poktnetwork" ><img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"></a>
  <a href="https://t.me/POKTnetwork"><img src="https://img.shields.io/badge/Telegram-blue.svg"></a>
  <a href="https://www.facebook.com/POKTnetwork" ><img src="https://img.shields.io/badge/Facebook-red.svg"></a>
  <a href="https://research.pokt.network"><img src="https://img.shields.io/discourse/https/research.pokt.network/posts.svg"></a>
</div>

# License

This project is licensed under the MIT License; see the [LICENSE.md](LICENSE.md) file for details.
