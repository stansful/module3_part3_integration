import { HttpBadRequestError } from '@floteam/errors';
import { SQSRecord } from 'aws-lambda';
import { requestPicturesIds } from './pexels.interfaces';
import { PexelsService } from './pexels.service';

export class PexelsManager {
  private readonly pexelsService = new PexelsService();

  public getPexelsPictures(searchValue?: string) {
    if (!searchValue) {
      throw new HttpBadRequestError('Please, provide search value');
    }

    return this.pexelsService.getPexelsPictures(searchValue);
  }

  public sendPicturesToImageQueue(body?: string) {
    if (!body) {
      throw new HttpBadRequestError('Please, provide body');
    }

    const parsedBody = JSON.parse(body);
    const ids: requestPicturesIds = parsedBody?.ids;

    if (!ids.length) {
      throw new HttpBadRequestError('Please, provide ids');
    }

    return this.pexelsService.sendPicturesToImageQueue(ids);
  }

  public processAndUploadPicture(records: SQSRecord[]) {
    const recordsArray: requestPicturesIds[] = records.map((record) => JSON.parse(record.body));

    const ids = recordsArray.flat().map((id) => {
      return typeof id === 'string' ? parseInt(id) : id;
    });

    return Promise.all(
      ids.map(async (id) => {
        return this.pexelsService.processAndUploadPicture(id);
      })
    );
  }
}
