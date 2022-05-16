import { getEnv } from '@helper/environment';
import { S3 } from 'aws-sdk';
import { GetObjectOutput, GetObjectRequest, PutObjectOutput, PutObjectRequest } from 'aws-sdk/clients/s3';

export class S3Service {
  private readonly s3 = new S3({ region: getEnv('REGION') });
  private readonly preSignedGetExpiresTimeInMinutes = Number(getEnv('PRE_SIGNED_GET_EXPIRES_TIME'));
  private readonly preSignedPutExpiresTimeInMinutes = Number(getEnv('PRE_SIGNED_PUT_EXPIRES_TIME'));

  public async getPreSignedGetUrl(key: string, bucket: string) {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * this.preSignedGetExpiresTimeInMinutes,
    };
    return this.s3.getSignedUrlPromise('getObject', params);
  }

  public async getPreSignedPutUrl(key: string, bucket: string, mimeType: string) {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: 60 * this.preSignedPutExpiresTimeInMinutes,
      ContentType: mimeType,
    };
    return this.s3.getSignedUrlPromise('putObject', params);
  }

  public async put(key: string, body: string | Buffer, bucket: string, acl = 'public-read'): Promise<PutObjectOutput> {
    const params: PutObjectRequest = {
      ACL: acl,
      Bucket: bucket,
      Key: key,
      Body: body,
    };
    return this.s3.putObject(params).promise();
  }

  public async get(key: string, bucket: string): Promise<GetObjectOutput> {
    const params: GetObjectRequest = {
      Bucket: bucket,
      Key: key,
    };
    return this.s3.getObject(params).promise();
  }
}
