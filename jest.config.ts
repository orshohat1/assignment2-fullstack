import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};

export default config;
