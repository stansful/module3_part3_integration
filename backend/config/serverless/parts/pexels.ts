import { GetAtt } from '../cf-intristic-fn';
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

    apiPexelsSendToPictureQueue: {
      handler: 'api/pexels/handler.sendToPictureQueue',
      memorySize: 128,
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

    triggerSqsPictureProcessingUploading: {
      handler: 'api/pexels/handler.pictureProcessingUploading',
      events: [
        {
          sqs: {
            arn: GetAtt('pictureQueue.Arn'),
            batchSize: 100,
            maximumBatchingWindow: 30,
            functionResponseType: 'ReportBatchItemFailures',
          },
        },
      ],
    },
  },
};
