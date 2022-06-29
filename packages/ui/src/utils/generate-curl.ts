import { INode } from '../types';

export const generateCurlString = (node: INode): string => {
  const { basicAuth, chain, url } = node;
  const { endpoint, rpc } = chain;

  const uAuth = basicAuth ? `-u ${basicAuth} ` : '';
  const method = rpc ? 'POST' : 'GET';
  const data = rpc ? `--data '${rpc}' ` : '';
  const fullUrl = `${url.replace(/\/\s*$/, '')}${endpoint || ''}`;

  return `curl ${uAuth}-X ${method} -H 'Content-Type: application/json' ${data}${fullUrl}`;
};
