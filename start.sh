cd /home/ubuntu/run/
yarn
yarn build
pm2 start dist/index.js
pm2 start dist/api