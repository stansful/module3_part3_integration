import { HttpBadRequestError } from '@floteam/errors';
import { log } from '@helper/logger';
import { SQSRecord } from 'aws-lambda';
import { PexelsService } from './pexels.service';

export class PexelsManager {
  private readonly pexelsService = new PexelsService();

  public getPexelsPictures(searchValue?: string) {
    try {
      return this.pexelsService.searchPexelsImages(searchValue);
    } catch (error) {
      log('Failed to get pexels pictures, at getPexelsPictures in pexel manage, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public sendToPictureQueue(body?: string) {
    try {
      const ids = this.pexelsService.validateIncomingBodyIds(body);
      return this.pexelsService.sendToPictureQueue(ids);
    } catch (error) {
      log('Failed to send pictures to the queue, at sendToPictureQueue in pexels manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public processAndUploadPictures(records: SQSRecord[]) {
    try {
      const pictureIds = this.pexelsService.parseIncomingSqsRecords(records);
      return this.pexelsService.processAndUploadPictures(pictureIds);
    } catch (error) {
      log('Failed to process and upload pictures, at processAndUploadPictures in pexels manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }
}
