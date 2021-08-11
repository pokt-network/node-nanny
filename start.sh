export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
cd /home/ubuntu/run
pm2 kill
yarn
yarn build
pm2 start dist --cron-restart="0 * * * *"
pm2 start dist/api
