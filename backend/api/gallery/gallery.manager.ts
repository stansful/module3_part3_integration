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
    try {
      const metadata = this.galleryService.validateIncomingBodyMetadata(body);
      return this.galleryService.uploadPicture(metadata);
    } catch (error) {
      throw new HttpBadRequestError(error.message);
    }
  }

  public getPreSignedUploadLink(email: string, body?: string) {
    const metadata = this.galleryService.validateIncomingBodyMetadata(body);
    return this.galleryService.getPreSignedUploadLink(email, metadata);
  }

  public updateImage(imageName: string) {
    if (imageName.startsWith('_SK')) {
      throw new AlreadyExistsError('Image already resized');
    }

    return this.galleryService.updateImage(imageName);
  }
}
