import { SQS } from 'aws-sdk';
import { SendMessageResult } from 'aws-sdk/clients/sqs';

export class SQSService {
  private readonly sqs = new SQS();
  private readonly queueUrl: string;

  constructor(queueUrl: string) {
    this.queueUrl = queueUrl;
  }

  public async sendMessage(body: string): Promise<SendMessageResult> {
    const params = {
      QueueUrl: this.queueUrl,
      MessageBody: body,
    };
    return this.sqs.sendMessage(params).promise();
  }
}
