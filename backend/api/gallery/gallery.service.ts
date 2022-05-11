import { HttpBadRequestError, HttpInternalServerError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { DynamoUserImage, ImageService } from '@services/dynamoDB/entities/image.service';
import { S3Service } from '@services/s3.service';
import { UserService } from '@services/dynamoDB/entities/user.service';
import * as uuid from 'uuid';
import {
  Metadata,
  PreSignedUploadResponse,
  RequestGalleryQueryParams,
  SanitizedQueryParams,
} from './gallery.interfaces';

export class GalleryService {
  private readonly imageService = new ImageService();
  private readonly userService = new UserService();
  private readonly s3Service = new S3Service();
  private readonly imageBucket = getEnv('BUCKET');
  private readonly pictureLimit = getEnv('DEFAULT_PICTURE_LIMIT');

  private async generatePreSignedUploadResponse(metadata: Metadata, email?: string): Promise<PreSignedUploadResponse> {
    const generatedImageName = (uuid.v4() + '.jpeg').toLowerCase();

    await this.imageService.create({ name: generatedImageName, metadata, status: 'Pending' }, email);

    const uploadUrl = await this.s3Service.getPreSignedPutUrl(generatedImageName, this.imageBucket);

    return { key: generatedImageName, uploadUrl };
  }

  private parseQueryParam(defaultValue: number, num?: string): number {
    if (!num) {
      return defaultValue;
    }

    const result = parseInt(num);

    const isInfinity = !isFinite(result);

    if (isInfinity) throw new HttpBadRequestError('I thought we were friends... Dont do this =(');

    if (result < 1) throw new HttpBadRequestError('Query params value must be more than zero');

    return result;
  }

  public validateAndSanitizeQuery(query: RequestGalleryQueryParams): SanitizedQueryParams {
    const requestPage = this.parseQueryParam(1, query.page);
    const limit = this.parseQueryParam(parseInt(this.pictureLimit), query.limit);

    const skip = requestPage * limit - limit;
    const uploadedByUser = query.filter === 'true';

    return { limit, skip, uploadedByUser };
  }

  public async getPictures(query: SanitizedQueryParams, email: string) {
    const { uploadedByUser, skip, limit } = query;
    let pictures: DynamoUserImage[];

    try {
      if (uploadedByUser) {
        const user = await this.userService.getProfileByEmail(email);
        pictures = await this.imageService.getByUserEmail(user.email);
      } else {
        pictures = await this.imageService.getAllImages();
      }

      return Promise.all(
        pictures
          .filter((picture) => picture.status === 'Uploaded')
          .slice(skip, skip + limit)
          .map(async (picture) => {
            return {
              path: await this.s3Service.getPreSignedGetUrl(picture.name, this.imageBucket),
              metadata: picture.metadata,
            };
          })
      );
    } catch (error) {
      throw new HttpInternalServerError('Cant send pictures...', error.message);
    }
  }

  public async uploadPicture(metadata: Metadata): Promise<PreSignedUploadResponse> {
    try {
      return this.generatePreSignedUploadResponse(metadata);
    } catch (error) {
      throw new HttpBadRequestError('Default picture already exist');
    }
  }

  public async getPreSignedUploadLink(email: string, metadata: Metadata): Promise<PreSignedUploadResponse> {
    try {
      return this.generatePreSignedUploadResponse(metadata, email);
    } catch (error) {
      throw new HttpBadRequestError('Picture already exist');
    }
  }

  public async updateImageStatus(imageName: string) {
    const images = await this.imageService.getByImageName(imageName);
    const image = images[0];
    const email = image.primaryKey.split('#')[1];
    await this.imageService.update(email, imageName, { ...image, status: 'Uploaded' });
  }
}
