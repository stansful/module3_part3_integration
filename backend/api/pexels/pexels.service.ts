import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { createClient, ErrorResponse, PaginationParams, PhotosWithTotalResults } from 'pexels';

export class PexelsService {
  private readonly apiKey = getEnv('PEXELS_API_KEY');
  private readonly client = createClient(this.apiKey);
  private readonly maxItemsPerPage = 20;

  private async searchPexelImages(searchValue: string) {
    const params: PaginationParams & { query: string } = {
      query: searchValue,
      per_page: this.maxItemsPerPage,
    };

    const pictures: PhotosWithTotalResults | ErrorResponse = await this.client.photos.search(params);

    if ('error' in pictures) {
      throw new HttpBadRequestError('Failed to fetch images');
    }

    return pictures.photos;
  }

  public async getPexelsPictures(searchValue: string) {
    try {
      return this.searchPexelImages(searchValue);
    } catch (error) {
      throw new HttpBadRequestError(error.message);
    }
  }
}
