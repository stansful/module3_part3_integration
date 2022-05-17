import * as uuid from 'uuid';

export class UniqGeneratorService {
  public generateNameWithLowerCase(...args: string[]) {
    return (uuid.v4() + args.join('')).toLowerCase();
  }
}
