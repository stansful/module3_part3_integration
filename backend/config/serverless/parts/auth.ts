import { AWSPartitial } from '../types';

export const authConfig: AWSPartitial = {
  provider: {
    httpApi: {
      authorizers: {
        jwtSimpleAuthorizerHttpApi: {
          type: 'request',
          enableSimpleResponses: true,
          functionName: 'jwtAuthorizerHttpApi',
          identitySource: '$request.header.Authorization',
        },
      },
    },
  },

  functions: {
    jwtAuthorizerHttpApi: {
      handler: 'api/auth/handler.authenticate',
      memorySize: 128,
    },

    apiAuthSignIn: {
      handler: 'api/auth/handler.signIn',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/auth/signIn',
            method: 'post',
          },
        },
      ],
    },

    apiAuthSignUp: {
      handler: 'api/auth/handler.signUp',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/auth/signUp',
            method: 'post',
          },
        },
      ],
    },
  },
};
