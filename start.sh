cd /home/ubuntu/run/
pm2 kill all
yarn
yarn build
pm2 start dist/index.js
pm2 start dist/api