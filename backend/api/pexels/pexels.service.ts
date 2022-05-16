import { HttpBadRequestError, HttpTooManyRequestsError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { ImageService } from '@services/dynamoDB/entities/image.service';
import { MetaDataService } from '@services/meta-data.service';
import { S3Service } from '@services/s3.service';
import { SQSService } from '@services/sqs.service';
import axios from 'axios';
import { createClient, ErrorResponse, PaginationParams, PhotosWithTotalResults } from 'pexels';
import * as uuid from 'uuid';
import { requestPicturesIds } from './pexels.interfaces';

export class PexelsService {
  private readonly imageService = new ImageService();
  private readonly s3Service = new S3Service();
  private readonly metaDataService = new MetaDataService();
  private readonly sqsService = new SQSService(getEnv('PICTURE_QUEUE_URL'));
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
      throw new HttpTooManyRequestsError('Api limit reached, try again later');
    }

    return pictures.photos;
  }

  private async getPexelPictureById(id: number | string) {
    const picture = await this.pexelsClient.photos.show({ id });

    if ('error' in picture) {
      throw new HttpTooManyRequestsError('Api limit reached, try again later');
    }

    return picture;
  }

  private async downloadPicture(url: string): Promise<Buffer> {
    const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(imageResponse.data);
  }

  public async getPexelsPictures(searchValue: string) {
    return this.searchPexelImages(searchValue);
  }

  public async sendPicturesToImageQueue(ids: requestPicturesIds) {
    try {
      await this.sqsService.sendMessage(JSON.stringify(ids));
    } catch (error) {
      throw new HttpBadRequestError('Failed to send ids to the queue');
    }
  }

  public async processAndUploadPicture(pictureId: number) {
    const pictureOriginSize = await this.getPexelPictureById(pictureId);

    const { width, height } = pictureOriginSize;
    const originalPictureUrl = pictureOriginSize.src.original;
    const pictureExtension = originalPictureUrl.split('.').pop() || 'jpeg';
    const newImageName = `${uuid.v4()}.${pictureExtension}`.toLowerCase();

    const imageBuffer = await this.downloadPicture(originalPictureUrl);

    const fileSize = this.metaDataService.getFileSizeFromBuffer(imageBuffer);

    const metadata = { width, height, fileSize, fileExtension: pictureExtension };

    await this.imageService.create({ name: newImageName, metadata, status: 'Pending', subClipCreated: false });

    await this.s3Service.put(newImageName, imageBuffer, this.imageBucket);
  }
}
