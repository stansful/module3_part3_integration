import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { ImageService } from '@services/dynamoDB/entities/image.service';
import { MetaDataService } from '@services/meta-data.service';
import { S3Service } from '@services/s3.service';
import axios from 'axios';
import { createClient, ErrorResponse, PaginationParams, PhotosWithTotalResults } from 'pexels';
import * as uuid from 'uuid';

export class PexelsService {
  private readonly imageService = new ImageService();
  private readonly s3Service = new S3Service();
  private readonly metaDataService = new MetaDataService();
  private readonly apiKey = getEnv('PEXELS_API_KEY');
  private readonly imageBucket = getEnv('BUCKET');
  private readonly pexelsClient = createClient(this.apiKey);
  private readonly maxItemsPerPage = 20;

  private async searchPexelImages(searchValue: string) {
    const params: PaginationParams & { query: string } = {
      query: searchValue,
      per_page: this.maxItemsPerPage,
    };

    const pictures: PhotosWithTotalResults | ErrorResponse = await this.pexelsClient.photos.search(params);

    if ('error' in pictures) {
      throw new HttpBadRequestError('Failed to fetch images');
    }

    return pictures.photos;
  }

  private async getPexelPictureById(id: number | string) {
    const picture = await this.pexelsClient.photos.show({ id });

    if ('error' in picture) {
      throw new HttpBadRequestError('Failed to fetch images');
    }

    return picture;
  }

  private async downloadPicture(url: string): Promise<Buffer> {
    const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(imageResponse.data);
  }

  public async getPexelsPictures(searchValue: string) {
    try {
      return this.searchPexelImages(searchValue);
    } catch (error) {
      throw new HttpBadRequestError(error.message);
    }
  }

  public async uploadPexelPictures(ids: string[] | number[]) {
    try {
      const picturesOriginSize = await Promise.all(
        ids.map(async (id) => {
          return this.getPexelPictureById(id);
        })
      );

      const addPicturesToDynamoAndS3 = picturesOriginSize.map(async (picture) => {
        const { width, height } = picture;
        const originalPictureUrl = picture.src.original;
        const pictureExtension = originalPictureUrl.split('.').pop() || 'jpeg';
        const imageBuffer = await this.downloadPicture(originalPictureUrl);
        const fileSize = this.metaDataService.getFileSizeFromBuffer(imageBuffer);
        const newImageName = `${uuid.v4()}.${pictureExtension}`.toLowerCase();
        const metadata = { width, height, fileSize, fileExtension: pictureExtension };

        await this.imageService.create({ name: newImageName, metadata, status: 'Pending', subClipCreated: false });

        await this.s3Service.put(newImageName, imageBuffer, this.imageBucket);
      });

      await Promise.all(addPicturesToDynamoAndS3);
    } catch (error) {
      throw new HttpBadRequestError('Something wrong happened...');
    }
  }
}
