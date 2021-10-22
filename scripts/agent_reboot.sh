#!/bin/bash
cd /home/$USER/node-deploy/$2
docker stop $1
sleep 2
echo "waiting for shutdown"
docker-compose up -d
