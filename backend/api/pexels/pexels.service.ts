import { HttpBadRequestError, HttpTooManyRequestsError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { ImageService } from '@services/dynamoDB/entities/image.service';
import { MetaDataService } from '@services/meta-data.service';
import { S3Service } from '@services/s3.service';
import { UniqGeneratorService } from '@services/uniq-generator.service';
import { SQSRecord } from 'aws-lambda';
import axios from 'axios';
import { createClient, ErrorResponse, PaginationParams, Photo, PhotosWithTotalResults } from 'pexels';
import { requestPicturesIds } from './pexels.interfaces';

export class PexelsService {
  private readonly imageService = new ImageService();
  private readonly s3Service = new S3Service();
  private readonly metaDataService = new MetaDataService();
  private readonly uniqGeneratorService = new UniqGeneratorService();
  private readonly apiKey = getEnv('PEXELS_API_KEY');
  private readonly imageBucket = getEnv('BUCKET');
  private readonly pexelsClient = createClient(this.apiKey);
  private readonly maxItemsPerPage = 20;
  private readonly imageExtensionSeparator = '.';

  public validateIncomingBodyIds(body?: string): requestPicturesIds {
    if (!body) {
      throw new HttpBadRequestError('Please, provide body');
    }

    const parsedBody = JSON.parse(body);
    const ids: requestPicturesIds = parsedBody?.ids;

    if (!ids.length) {
      throw new HttpBadRequestError('Please, provide ids');
    }

    return ids;
  }

  public parseIncomingSqsRecords(records: SQSRecord[]): number[] {
    return records
      .map((record) => JSON.parse(record.body) as requestPicturesIds)
      .flat()
      .map((id) => {
        return typeof id === 'string' ? parseInt(id) : id;
      });
  }

  public async searchPexelsImages(searchValue?: string): Promise<Photo[]> {
    if (!searchValue) {
      throw new HttpBadRequestError('Please, provide search value');
    }

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

  public async getPexelPictureById(id: number | string): Promise<Photo> {
    const picture = await this.pexelsClient.photos.show({ id });

    if ('error' in picture) {
      throw new HttpTooManyRequestsError('Api limit reached, try again later');
    }

    return picture;
  }

  public async downloadPexelsPicture(url: string): Promise<Buffer> {
    const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(imageResponse.data);
  }

  public async sendToPictureQueue(): Promise<ResponseMessage> {
    return { message: 'Images will upload as soon as possible' };
  }

  public async processAndUploadPictures(pictureIds: number[]): Promise<Awaited<void>[]> {
    return Promise.all(
      pictureIds.map(async (id) => {
        const picture = await this.getPexelPictureById(id);

        const { width, height } = picture;
        const pictureFullSizeUrl = picture.src.original;
        const pictureExtension = this.metaDataService.getFileExtensionFromName(pictureFullSizeUrl);

        const newImageName = this.uniqGeneratorService.generateNameWithLowerCase(
          this.imageExtensionSeparator,
          pictureExtension
        );

        const imageBuffer = await this.downloadPexelsPicture(pictureFullSizeUrl);

        const fileSize = this.metaDataService.getFileSizeFromBuffer(imageBuffer);

        const metadata = { width, height, fileSize, fileExtension: pictureExtension };

        await this.imageService.create({ name: newImageName, metadata, status: 'Pending', subClipCreated: false });

        await this.s3Service.put(newImageName, imageBuffer, this.imageBucket);
      })
    );
  }
}
