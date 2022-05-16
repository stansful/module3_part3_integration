import { DoesNotExistError } from '@exceptions/does-not-exist';
import Jimp from 'jimp';

export class ResizeService {
  private readonly defaultImageResizeWidth = 512;
  private readonly defaultImageResizeHeight = 250;

  public async resizeImage(
    data?: Buffer,
    extension = 'jpeg',
    width = this.defaultImageResizeWidth,
    height = this.defaultImageResizeHeight
  ): Promise<Buffer> {
    if (!data) {
      throw new DoesNotExistError('Image data does not exist');
    }

    const image = await Jimp.read(data);
    return image.resize(width, height).getBufferAsync(`image/${extension}`);
  }
}
