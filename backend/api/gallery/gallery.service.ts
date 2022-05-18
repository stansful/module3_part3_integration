import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { DynamoUserImage, ImageService } from '@services/dynamoDB/entities/image.service';
import { UserService } from '@services/dynamoDB/entities/user.service';
import { S3Service } from '@services/s3.service';
import {
  Metadata,
  PreSignedUploadResponse,
  RequestGalleryQueryParams,
  ResponseGetPictures,
  SanitizedQueryParams,
} from './gallery.interfaces';

export class GalleryService {
  private readonly imageService = new ImageService();
  private readonly userService = new UserService();
  private readonly s3Service = new S3Service();
  private readonly imageBucket = getEnv('BUCKET');
  private readonly pictureLimit = getEnv('DEFAULT_PICTURE_LIMIT');
  private readonly subClipPrefix = getEnv('SUB_CLIP_PREFIX');

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

  public validateIncomingBodyMetadata(body?: string): Metadata {
    if (!body) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    const parsedBody = JSON.parse(body);
    const metadata = parsedBody?.metadata as Metadata;

    if (!metadata) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    if (metadata.fileExtension !== 'jpeg') {
      throw new HttpBadRequestError('Sorry, but we support only jpeg');
    }

    return metadata;
  }

  public validateAndSanitizeQuery(query: RequestGalleryQueryParams): SanitizedQueryParams {
    const requestPage = this.parseQueryParam(1, query.page);
    const limit = this.parseQueryParam(parseInt(this.pictureLimit), query.limit);

    const skip = requestPage * limit - limit;
    const uploadedByUser = query.filter === 'true';

    return { limit, skip, uploadedByUser };
  }

  public checkIfImageAlreadySubClipped(imageName: string) {
    if (imageName.startsWith(this.subClipPrefix)) {
      throw new HttpBadRequestError('Image already resized');
    }
  }

  public async getAllOrUserPictures(uploadedByUser: boolean, email: string): Promise<DynamoUserImage[]> {
    let pictures: DynamoUserImage[];

    if (uploadedByUser) {
      const user = await this.userService.getProfileByEmail(email);
      pictures = await this.imageService.getByUserEmail(user.email);
    } else {
      pictures = await this.imageService.getAllImages();
    }

    return pictures;
  }

  public getRequiredPictures(pictures: DynamoUserImage[], skip: number, limit: number): DynamoUserImage[] {
    const uploadedPictures = pictures.filter((picture) => picture.status === 'Uploaded');
    const requiredPictures = uploadedPictures.slice(skip, skip + limit);
    return requiredPictures;
  }

  public async getOnePictureViewUrl(key: string, bucket: string): Promise<string> {
    return this.s3Service.getPreSignedGetUrl(key, bucket);
  }

  public async getPicturesViewUrl(pictures: DynamoUserImage[]) {
    const result = pictures.map(async (picture) => {
      return this.getOnePictureViewUrl(picture.name, this.imageBucket);
    });
    return Promise.all(result);
  }

  public getPictures(pictures: DynamoUserImage[], picturesViewUrl: string[]): ResponseGetPictures[] {
    return pictures.map((picture, index): ResponseGetPictures => {
      return {
        path: picturesViewUrl[index],
        metadata: picture.metadata,
      };
    });
  }

  public uploadPicture(imageName: string, uploadUrl: string): PreSignedUploadResponse {
    return { key: imageName, uploadUrl };
  }

  public getEmailFromPrimaryKey(key: string): string {
    return key.split('#')[1];
  }
}
