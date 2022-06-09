import { connect, disconnect } from '../db';
import { updaterScript } from './updater-script';

import env from '../environment';

(async () => {
  if (env('PNF')) return;

  await connect();
  console.log('Database connected ...');

  await updaterScript();

  await disconnect();
  console.log('Fin.');
})();
