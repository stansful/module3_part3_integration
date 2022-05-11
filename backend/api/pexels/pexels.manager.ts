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
}
