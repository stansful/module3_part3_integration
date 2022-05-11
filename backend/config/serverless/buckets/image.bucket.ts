import { AWSPartitial } from '../types';

export const imageBucketConfig: AWSPartitial = {
  provider: {
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: [
              'arn:aws:s3:::${file(env.yml):${self:provider.stage}.BUCKET}',
              'arn:aws:s3:::${file(env.yml):${self:provider.stage}.BUCKET}/*',
            ],
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      S3ImageBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${file(env.yml):${self:provider.stage}.BUCKET}',
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: ['*'],
                AllowedOrigins: ['*'],
                AllowedMethods: ['PUT'],
              },
            ],
          },
        },
      },
    },
  },
};
