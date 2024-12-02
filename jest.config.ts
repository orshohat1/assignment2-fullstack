import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Use ts-jest for TypeScript files
  },
  testEnvironment: 'node', // Use Node.js environment for testing
  moduleFileExtensions: ['ts', 'js', 'json', 'node'], // Add support for TypeScript files
};

export default config;
