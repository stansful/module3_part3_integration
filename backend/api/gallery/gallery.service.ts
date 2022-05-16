import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { DynamoUserImage, ImageService } from '@services/dynamoDB/entities/image.service';
import { ResizeService } from '@services/resize.service';
import { S3Service } from '@services/s3.service';
import { UserService } from '@services/dynamoDB/entities/user.service';
import * as uuid from 'uuid';
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
  private readonly resizeService = new ResizeService();
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

  public async getPictures(query: SanitizedQueryParams, email: string): Promise<Awaited<ResponseGetPictures>[]> {
    const { uploadedByUser, skip, limit } = query;
    let pictures: DynamoUserImage[];

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
  }

  public async generatePreSignedUploadResponse(metadata: Metadata, email?: string): Promise<PreSignedUploadResponse> {
    const generatedImageName = (uuid.v4() + '.' + metadata.fileExtension).toLowerCase();

    await this.imageService.create(
      {
        name: generatedImageName,
        metadata,
        status: 'Pending',
        subClipCreated: false,
      },
      email
    );

    const uploadUrl = await this.s3Service.getPreSignedPutUrl(
      generatedImageName,
      this.imageBucket,
      `image/${metadata.fileExtension}`
    );

    return { key: generatedImageName, uploadUrl };
  }

  public async updatePicture(imageName: string): Promise<void> {
    const images = await this.imageService.getByImageName(imageName);
    const image = images[0];

    const email = image.primaryKey.split('#')[1];

    const s3Image = await this.s3Service.get(imageName, this.imageBucket);

    const resizedImage = await this.resizeService.resizeImage(s3Image.Body as Buffer, image.metadata.fileExtension);

    await this.s3Service.put(`${this.subClipPrefix}${imageName}`, resizedImage, this.imageBucket);

    await this.imageService.update(email, imageName, { ...image, status: 'Uploaded', subClipCreated: true });
  }
}
