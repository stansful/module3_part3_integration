import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { log } from '@helper/logger';
import { ImageService } from '@services/dynamoDB/entities/image.service';
import { MetaDataService } from '@services/meta-data.service';
import { S3Service } from '@services/s3.service';
import { SQSService } from '@services/sqs.service';
import { UniqGeneratorService } from '@services/uniq-generator.service';
import { SQSRecord } from 'aws-lambda';
import { PexelsService } from './pexels.service';

export class PexelsManager {
  private readonly uniqGeneratorService: UniqGeneratorService;
  private readonly metaDataService: MetaDataService;
  private readonly pexelsService: PexelsService;
  private readonly imageService: ImageService;
  private readonly sqsService: SQSService;
  private readonly s3Service: S3Service;

  constructor() {
    this.uniqGeneratorService = new UniqGeneratorService();
    this.metaDataService = new MetaDataService();
    this.pexelsService = new PexelsService();
    this.imageService = new ImageService();
    this.s3Service = new S3Service();
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

  public processAndUploadPictures(records: SQSRecord[]) {
    try {
      const pictureIds = this.pexelsService.parseIncomingSqsRecords(records);
      return this.pexelsService.processAndUploadPictures(
        pictureIds,
        this.metaDataService.getFileExtensionFromName,
        this.uniqGeneratorService.generateNameWithLowerCase,
        this.metaDataService.getFileSizeFromBuffer,
        this.imageService.create,
        this.s3Service.put
      );
    } catch (error) {
      log('Failed to process and upload pictures, at processAndUploadPictures in pexels manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }
}
