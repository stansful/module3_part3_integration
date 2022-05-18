import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { log } from '@helper/logger';
import { ImageService } from '@services/dynamoDB/entities/image.service';
import { UserService } from '@services/dynamoDB/entities/user.service';
import { ResizeService } from '@services/resize.service';
import { S3Service } from '@services/s3.service';
import { UniqGeneratorService } from '@services/uniq-generator.service';
import { RequestGalleryQueryParams } from './gallery.interfaces';
import { GalleryService } from './gallery.service';

export class GalleryManager {
  private readonly uniqGeneratorService: UniqGeneratorService;
  private readonly galleryService: GalleryService;
  private readonly resizeService: ResizeService;
  private readonly imageService: ImageService;
  private readonly userService: UserService;
  private readonly s3Service: S3Service;
  private readonly subClipPrefix = getEnv('SUB_CLIP_PREFIX');
  private readonly imageBucket = getEnv('BUCKET');
  private readonly imageExtensionSeparator = '.';

  constructor() {
    this.uniqGeneratorService = new UniqGeneratorService();
    this.galleryService = new GalleryService();
    this.resizeService = new ResizeService();
    this.imageService = new ImageService();
    this.userService = new UserService();
    this.s3Service = new S3Service();
  }

  public async getPictures(query: RequestGalleryQueryParams, email: string) {
    try {
      const sanitizedQuery = this.galleryService.validateAndSanitizeQuery(query);

      const pictures = await this.galleryService.getAllOrUserPictures(
        sanitizedQuery.uploadedByUser,
        email,
        this.userService.getProfileByEmail,
        this.imageService.getByUserEmail,
        this.imageService.getAllImages
      );

      return this.galleryService.getPictures(
        pictures,
        sanitizedQuery.skip,
        sanitizedQuery.limit,
        this.s3Service.getPreSignedGetUrl
      );
    } catch (error) {
      log('Failed to get pictures, at getPictures in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public async uploadPicture(body?: string) {
    try {
      const metadata = this.galleryService.validateIncomingBodyMetadata(body);

      const newImageName = this.uniqGeneratorService.generateNameWithLowerCase(
        this.imageExtensionSeparator,
        metadata.fileExtension
      );

      await this.imageService.create({ name: newImageName, metadata, status: 'Pending', subClipCreated: false });

      const uploadUrl = await this.s3Service.getPreSignedPutUrl(
        newImageName,
        this.imageBucket,
        `image/${metadata.fileExtension}`
      );

      return this.galleryService.uploadPicture(newImageName, uploadUrl);
    } catch (error) {
      log('Failed to upload picture, at uploadPicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public async getPreSignedUploadLink(email: string, body?: string) {
    try {
      const metadata = this.galleryService.validateIncomingBodyMetadata(body);

      const newImageName = this.uniqGeneratorService.generateNameWithLowerCase(
        this.imageExtensionSeparator,
        metadata.fileExtension
      );

      await this.imageService.create({ name: newImageName, metadata, status: 'Pending', subClipCreated: false }, email);

      const uploadUrl = await this.s3Service.getPreSignedPutUrl(
        newImageName,
        this.imageBucket,
        `image/${metadata.fileExtension}`
      );

      return this.galleryService.uploadPicture(newImageName, uploadUrl);
    } catch (error) {
      log('Failed to upload picture, at uploadPicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public async updatePicture(imageName: string) {
    try {
      this.galleryService.checkIfImageAlreadySubClipped(imageName);

      const images = await this.imageService.getByImageName(imageName);
      const image = images[0];

      const email = this.galleryService.getEmailFromPrimaryKey(image.primaryKey);

      const s3Image = await this.s3Service.get(imageName, this.imageBucket);

      const resizedImage = await this.resizeService.resizeImage(s3Image.Body as Buffer, image.metadata.fileExtension);

      await this.s3Service.put(`${this.subClipPrefix}${imageName}`, resizedImage, this.imageBucket);

      await this.imageService.update(email, imageName, { ...image, status: 'Uploaded', subClipCreated: true });
    } catch (error) {
      log('Failed to update picture, at updatePicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }
}
