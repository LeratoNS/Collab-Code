// Type definitions for environment variables in Webpack

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL?: string;
  }
}

// Declare process global for browser environment
declare const process: {
  env: NodeJS.ProcessEnv;
};

