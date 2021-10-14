#!/bin/bash
cd /home/ubuntu/node-deploy/mock
docker stop $1
sleep 2
echo "waiting for shutdown"
docker-compose up -d