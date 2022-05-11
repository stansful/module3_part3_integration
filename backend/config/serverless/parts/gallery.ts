import { AWSPartitial } from '../types';

export const galleryConfig: AWSPartitial = {
  functions: {
    apiGalleryGetPictures: {
      handler: 'api/gallery/handler.getPictures',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery',
            method: 'get',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },

    apiGalleryUploadPicture: {
      handler: 'api/gallery/handler.uploadPicture',
      memorySize: 256,
      events: [
        {
          httpApi: {
            path: '/gallery',
            method: 'post',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },

    apiGalleryGetPreSignedUploadLink: {
      handler: 'api/gallery/handler.getPreSignedUploadLink',
      memorySize: 128,
      events: [
        {
          httpApi: {
            path: '/gallery/upload',
            method: 'post',
            authorizer: {
              name: 'jwtSimpleAuthorizerHttpApi',
            },
          },
        },
      ],
    },

    triggerS3Upload: {
      handler: 'api/gallery/handler.s3Upload',
      events: [
        {
          s3: {
            bucket: '${file(env.yml):${self:provider.stage}.BUCKET}',
            event: 's3:ObjectCreated:*',
            existing: true,
          },
        },
      ],
    },
  },
};
