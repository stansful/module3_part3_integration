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

    apiPexelsUploadPexelPictures: {
      handler: 'api/pexels/handler.uploadPexelPictures',
      memorySize: 512,
      events: [
        {
          httpApi: {
            path: '/pexels',
            method: 'post',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },
  },
};
