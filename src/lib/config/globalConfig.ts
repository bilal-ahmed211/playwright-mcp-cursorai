import * as pkg from '../../../package.json';

export const globalConfig = {
  app: {
    name: pkg.name,
    version: pkg.version,
  },
  env: 'local',
  logLevel: 'info',
}; 