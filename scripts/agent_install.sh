curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install node
npm install yarn pm2 -g
git clone git@github.com:pokt-foundation/node-monitoring.git
cd node-monitoring
chmod +x scripts/agent_reboot.sh
chmod +x scripts/agent_reboot_pokt.sh
yarn && yarn build
pm2 start dist/agent
curl localhost:3001/ping
