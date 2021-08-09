export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

cd /home/ubuntu/run
/home/ubuntu/.nvm/versions/node/v16.5.0/bin/pm2 kill all
/home/ubuntu/.nvm/versions/node/v16.5.0/bin/yarn
/home/ubuntu/.nvm/versions/node/v16.5.0/bin/yarn build
/home/ubuntu/.nvm/versions/node/v16.5.0/bin/pm2 start dist/index.js
/home/ubuntu/.nvm/versions/node/v16.5.0/bin/pm2 start dist/api