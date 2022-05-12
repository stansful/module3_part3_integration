import { AlreadyExistsError, HttpBadRequestError } from '@floteam/errors';
import { RequestGalleryQueryParams } from './gallery.interfaces';
import { GalleryService } from './gallery.service';

export class GalleryManager {
  private readonly galleryService: GalleryService;

  constructor() {
    this.galleryService = new GalleryService();
  }

  public getPictures(query: RequestGalleryQueryParams, email: string) {
    const sanitizedQuery = this.galleryService.validateAndSanitizeQuery(query);
    return this.galleryService.getPictures(sanitizedQuery, email);
  }

  public uploadPicture(body?: string) {
    if (!body) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    try {
      const parsedBody = JSON.parse(body);
      const metadata = parsedBody?.metadata;

      return this.galleryService.uploadPicture(metadata);
    } catch (error) {
      throw new HttpBadRequestError('Invalid body');
    }
  }

  public getPreSignedUploadLink(email: string, body?: string) {
    if (!body) {
      throw new HttpBadRequestError('Please, provide picture metadata');
    }

    try {
      const parsedBody = JSON.parse(body);
      const metadata = parsedBody?.metadata;

      return this.galleryService.getPreSignedUploadLink(email, metadata);
    } catch (error) {
      throw new HttpBadRequestError('Invalid body');
    }
  }

  public updateImage(imageName: string) {
    if (imageName.startsWith('_SK')) {
      throw new AlreadyExistsError('Image already resized');
    }

    return this.galleryService.updateImage(imageName);
  }
}
