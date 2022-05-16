import { HttpBadRequestError } from '@floteam/errors';
import { getEnv } from '@helper/environment';
import { log } from '@helper/logger';
import { RequestGalleryQueryParams } from './gallery.interfaces';
import { GalleryService } from './gallery.service';

export class GalleryManager {
  private readonly galleryService: GalleryService;
  private readonly subClipPrefix = getEnv('SUB_CLIP_PREFIX');

  constructor() {
    this.galleryService = new GalleryService();
  }

  public getPictures(query: RequestGalleryQueryParams, email: string) {
    try {
      const sanitizedQuery = this.galleryService.validateAndSanitizeQuery(query);

      return this.galleryService.getPictures(sanitizedQuery, email);
    } catch (error) {
      log('Failed to get pictures, at getPictures in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public uploadPicture(body?: string) {
    try {
      const metadata = this.galleryService.validateIncomingBodyMetadata(body);

      return this.galleryService.generatePreSignedUploadResponse(metadata);
    } catch (error) {
      log('Failed to upload picture, at uploadPicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public getPreSignedUploadLink(email: string, body?: string) {
    try {
      const metadata = this.galleryService.validateIncomingBodyMetadata(body);

      return this.galleryService.generatePreSignedUploadResponse(metadata, email);
    } catch (error) {
      log('Failed to upload picture, at uploadPicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public updatePicture(imageName: string) {
    try {
      if (imageName.startsWith(this.subClipPrefix)) {
        return log('Image already resized');
      }

      return this.galleryService.updatePicture(imageName);
    } catch (error) {
      log('Failed to update picture, at updatePicture in gallery manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }
}
