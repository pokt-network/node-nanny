curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
nvm install 16
npm install pm2 -g
git clone https://github.com/pokt-foundation/node-nanny.git
cd node-nanny
chmod +x scripts/agent_reboot.sh
chmod +x scripts/agent_reboot_pokt.sh
npm i && npm run build
pm2 start dist/agent
curl localhost:3001/ping
