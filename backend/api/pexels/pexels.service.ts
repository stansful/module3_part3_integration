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
import { PictureInfo, requestPicturesIds } from './pexels.interfaces';

export class PexelsService {
  private readonly uniqGeneratorService = new UniqGeneratorService();
  private readonly metaDataService = new MetaDataService();
  private readonly imageService = new ImageService();
  private readonly s3Service = new S3Service();
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

  public async getOnePexelPictureById(id: number | string): Promise<Photo> {
    const picture = await this.pexelsClient.photos.show({ id });

    if ('error' in picture) {
      throw new HttpTooManyRequestsError('Api limit reached, try again later');
    }

    return picture;
  }

  public async getPexelPicturesById(ids: number[]): Promise<Photo[]> {
    const pictureIds = ids.map(async (id) => await this.getOnePexelPictureById(id));
    return Promise.all(pictureIds);
  }

  public async downloadOnePexelsPicture(url: string): Promise<Buffer> {
    const imageResponse = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(imageResponse.data);
  }

  public downloadPexelsPictures(picturesInfo: PictureInfo[]): Promise<Buffer[]> {
    const buffers = picturesInfo.map((pictureInfo) => this.downloadOnePexelsPicture(pictureInfo.url));
    return Promise.all(buffers);
  }

  public sendToPictureQueue(): ResponseMessage {
    return { message: 'Images will upload as soon as possible' };
  }

  public getOnePictureInfo(picture: Photo): PictureInfo {
    const { width, height } = picture;
    const pictureMaxResolutionUrl = picture.src.original;
    const pictureExtension = this.metaDataService.getFileExtensionFromName(pictureMaxResolutionUrl);
    const uniqKey = this.uniqGeneratorService.generateNameWithLowerCase(this.imageExtensionSeparator, pictureExtension);

    return { width, height, url: pictureMaxResolutionUrl, key: uniqKey, fileExtension: pictureExtension };
  }

  public getPicturesInfo(pictures: Photo[]): PictureInfo[] {
    return pictures.map((picture) => this.getOnePictureInfo(picture));
  }

  public calculateOnePictureSize(buffer: Buffer): number {
    return this.metaDataService.getFileSizeFromBuffer(buffer);
  }

  public calculatePicturesSize(buffers: Buffer[]): number[] {
    return buffers.map((buffer) => this.calculateOnePictureSize(buffer));
  }

  public async addOnePictureToDynamoDb(name: string, pictureInfo: Omit<PictureInfo, 'url' | 'key'>, fileSize: number) {
    const metadata = {
      ...pictureInfo,
      fileSize,
    };

    await this.imageService.create({ name, metadata, status: 'Pending', subClipCreated: false });
  }

  public async addPicturesToDynamoDb(picturesInfo: PictureInfo[], picturesSize: number[]) {
    const result = picturesInfo.map(async (pictureInfo, index) => {
      const metadata = {
        width: pictureInfo.width,
        height: pictureInfo.height,
        fileExtension: pictureInfo.fileExtension,
      };

      return this.addOnePictureToDynamoDb(pictureInfo.key, metadata, picturesSize[index]);
    });

    await Promise.all(result);
  }

  public async uploadOnePictureToS3(key: string, buffer: Buffer, bucket = this.imageBucket) {
    await this.s3Service.put(key, buffer, bucket);
  }

  public async uploadPicturesToS3(picturesInfo: PictureInfo[], picturesBuffer: Buffer[]) {
    const result = picturesInfo.map(async (picture, index) => {
      return this.uploadOnePictureToS3(picture.key, picturesBuffer[index]);
    });

    await Promise.all(result);
  }
}
