import { HttpBadRequestError } from '@floteam/errors';
import { PexelsService } from './pexels.service';

export class PexelsManager {
  private readonly pexelsService = new PexelsService();

  public getPexelsPictures(searchValue?: string) {
    if (!searchValue) {
      throw new HttpBadRequestError('Please, provide search value');
    }

    return this.pexelsService.getPexelsPictures(searchValue);
  }

  public uploadPexelPictures(body?: string) {
    if (!body) {
      throw new HttpBadRequestError('Please, provide body');
    }

    const parsedBody = JSON.parse(body);
    const ids: string[] | number[] = parsedBody?.ids;

    if (!ids.length) {
      throw new HttpBadRequestError('Please, provide ids');
    }

    return this.pexelsService.uploadPexelPictures(ids);
  }
}
