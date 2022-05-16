export class MetaDataService {
  public getFileSizeFromBuffer(data: Buffer): number {
    return Buffer.byteLength(data);
  }

  public getFileExtensionFromName(name: string): string {
    return name.split('.').pop() || 'jpeg';
  }
}
