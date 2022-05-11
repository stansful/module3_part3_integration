import { AWSPartitial } from '../types';

export const pexelsConfig: AWSPartitial = {
  functions: {
    apiPexelsGetPexelsPictures: {
      handler: 'api/pexels/handler.getPexelsPictures',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/pexels',
            method: 'get',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },
  },
};
