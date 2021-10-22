#!/bin/bash
cd /home/$USER/pokt/$3
docker stop $1
sleep 2
echo "waiting for shutdown"
docker-compose up -d
echo $1
docker exec $2 nginx -s reload