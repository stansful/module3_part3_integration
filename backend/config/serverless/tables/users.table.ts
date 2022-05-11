import { AWSPartitial } from '../types';

export const usersTableConfig: AWSPartitial = {
  provider: {
    environment: {
      USERS_TABLE_NAME: '${self:custom.tablesNames.UsersTable.${self:provider.stage}}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:DescribeTable',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:DeleteItem',
              'dynamodb:UpdateItem',
              'dynamodb:BatchGetItem',
              'dynamodb:BatchWriteItem',
            ],
            Resource: [
              'arn:aws:dynamodb:*:*:table/${self:custom.tablesNames.UsersTable.${self:provider.stage}}',
              'arn:aws:dynamodb:*:*:table/${self:custom.tablesNames.UsersTable.${self:provider.stage}}/index/*',
            ],
          },
        ],
      },
    },
  },
  resources: {
    Resources: {
      UsersTable: {
        Type: 'AWS::DynamoDB::Table',
        DeletionPolicy: 'Retain',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'primaryKey',
              AttributeType: 'S',
            },
            {
              AttributeName: 'sortKey',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'primaryKey',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'sortKey',
              KeyType: 'RANGE',
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'InvertedIndexes',
              KeySchema: [
                {
                  AttributeName: 'sortKey',
                  KeyType: 'HASH',
                },
                {
                  AttributeName: 'primaryKey',
                  KeyType: 'RANGE',
                },
              ],
              Projection: {
                ProjectionType: 'ALL',
              },
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:custom.tablesNames.UsersTable.${self:provider.stage}}',
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
        },
      },
    },
  },
  custom: {
    tablesNames: {
      UsersTable: {
        local: 'stansful-Users-local',
        dev: 'stansful-Users-dev',
        test: 'stansful-Users-test',
        prod: 'stansful-Users',
      },
    },
  },
};
