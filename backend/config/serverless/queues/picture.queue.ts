import { GetAtt, Ref } from '../cf-intristic-fn';
import { AWSPartitial } from '../types';

export const pictureQueueConfig: AWSPartitial = {
  provider: {
    environment: {
      PICTURE_QUEUE_URL: '${self:custom.queuesUrls.pictureQueue.${self:provider.stage}}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['sqs:DeleteMessage', 'sqs:ReceiveMessage', 'sqs:SendMessage', 'sqs:ChangeMessageVisibility'],
            Resource: [GetAtt('pictureQueue.Arn')],
          },
        ],
      },
    },
  },

  resources: {
    Resources: {
      pictureQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: '${self:custom.queuesNames.pictureQueue.${self:provider.stage}}',
          VisibilityTimeout: 30,
          DelaySeconds: 60,
        },
      },
    },
  },
  custom: {
    queuesUrls: {
      pictureQueue: {
        local: '',
        dev: Ref('pictureQueue'),
        test: Ref('pictureQueue'),
        prod: Ref('pictureQueue'),
      },
    },
    queuesNames: {
      pictureQueue: {
        local: 'stansful-local-picture',
        dev: 'stansful-dev-picture',
        test: 'stansful-test-picture',
        prod: 'stansful-prod-picture',
      },
    },
  },
};
