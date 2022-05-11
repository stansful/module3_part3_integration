import { BinaryLike, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { getEnv } from '@helper/environment';

type UnEncryptedData = string | Buffer;

interface Hashing {
  encrypt(data: UnEncryptedData): Promise<string>;

  verify(data: UnEncryptedData, encryptedData: string): Promise<void>;
}

const scryptAsync = promisify<BinaryLike, BinaryLike, number, Buffer>(scrypt);

export class HashingService implements Hashing {
  private readonly keyLength = Number(getEnv('KEY_LENGTH')) || 20;
  private readonly encryptedDataSeparator = ':';

  public async encrypt(data: UnEncryptedData) {
    const salt = randomBytes(10).toString('hex');
    const encryptedKey = await scryptAsync(data, salt, this.keyLength);
    return salt + this.encryptedDataSeparator + encryptedKey.toString();
  }

  public async verify(data: UnEncryptedData, encryptedData: string) {
    const [salt, encryptedKey] = encryptedData.split(this.encryptedDataSeparator);

    const candidateKey = await scryptAsync(data, salt, this.keyLength);

    const isValid = encryptedKey === candidateKey.toString();

    if (!isValid) {
      throw new Error('Verification failed, data is not equal');
    }
  }
}
