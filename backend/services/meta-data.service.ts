import { ExifParserFactory } from 'ts-exif-parser';

export class MetaDataService {
  public static async getExifMetadata(data: Buffer) {
    return ExifParserFactory.create(data).parse();
  }

  public getFileSizeFromBuffer(data: Buffer) {
    return Buffer.byteLength(data);
  }
}
