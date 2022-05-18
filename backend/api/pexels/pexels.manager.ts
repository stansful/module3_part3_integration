import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { log } from '@helper/logger';
import { SQSService } from '@services/sqs.service';
import { SQSRecord } from 'aws-lambda';
import { PexelsService } from './pexels.service';

export class PexelsManager {
  private readonly pexelsService: PexelsService;
  private readonly sqsService: SQSService;

  constructor() {
    this.pexelsService = new PexelsService();
    this.sqsService = new SQSService(getEnv('PICTURE_QUEUE_URL'));
  }

  public getPexelsPictures(searchValue?: string) {
    try {
      return this.pexelsService.searchPexelsImages(searchValue);
    } catch (error) {
      log('Failed to get pexels pictures, at getPexelsPictures in pexels manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public async sendToPictureQueue(body?: string) {
    try {
      const ids = this.pexelsService.validateIncomingBodyIds(body);
      const preparedIds = JSON.stringify(ids);

      await this.sqsService.sendMessage(preparedIds);

      return this.pexelsService.sendToPictureQueue();
    } catch (error) {
      log('Failed to send pictures to the queue, at sendToPictureQueue in pexels manager, error:', error);
      throw new HttpBadRequestError('Failed to send ids to the queue');
    }
  }

  public async processAndUploadPictures(records: SQSRecord[]) {
    try {
      const ids = this.pexelsService.parseIncomingSqsRecords(records);
      const picturesId = await this.pexelsService.getPexelPicturesById(ids);
      const picturesInfo = this.pexelsService.getPicturesInfo(picturesId);
      const picturesBuffer = await this.pexelsService.downloadPexelsPictures(picturesInfo);
      const picturesSize = this.pexelsService.calculatePicturesSize(picturesBuffer);
      await this.pexelsService.addPicturesToDynamoDb(picturesInfo, picturesSize);
      await this.pexelsService.uploadPicturesToS3(picturesInfo, picturesBuffer);
    } catch (error) {
      log('Failed to process and upload pictures, at processAndUploadPictures in pexels manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }
}
