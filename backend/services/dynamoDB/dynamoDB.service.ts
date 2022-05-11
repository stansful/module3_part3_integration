import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  TranslateConfig,
} from '@aws-sdk/lib-dynamodb';
import { getEnv } from '@helper/environment';

export class DynamoDBService {
  private readonly dynamoDBDocClient: DynamoDBDocumentClient;

  constructor() {
    const options: TranslateConfig = {
      marshallOptions: {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true,
      },
    };
    const dynamoDBClient = new DynamoDBClient({ region: getEnv('REGION') });
    this.dynamoDBDocClient = DynamoDBDocumentClient.from(dynamoDBClient, options);
  }

  public async get(tableName: string, primaryKey: string, sortKey: string) {
    const params: GetCommandInput = {
      TableName: tableName,
      Key: {
        primaryKey: primaryKey,
        sortKey: sortKey,
      },
    };
    return this.dynamoDBDocClient.send(new GetCommand(params));
  }

  public async put(tableName: string, primaryKey: string, sortKey: string, attributes: Record<string, any> = {}) {
    const params: PutCommandInput = {
      TableName: tableName,
      Item: {
        primaryKey: primaryKey,
        sortKey: sortKey,
        ...attributes,
      },
    };
    return this.dynamoDBDocClient.send(new PutCommand(params));
  }

  public async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: { [p: string]: unknown },
    indexName?: string
  ) {
    const params: QueryCommandInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };
    return this.dynamoDBDocClient.send(new QueryCommand(params));
  }
}
