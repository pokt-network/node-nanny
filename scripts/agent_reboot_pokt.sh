#!/bin/bash
cd /home/ubuntu/node-deploy/shared
docker stop $1
sleep 2
echo "waiting for shutdown"
docker-compose up -d
docker exec $2 nginx -s