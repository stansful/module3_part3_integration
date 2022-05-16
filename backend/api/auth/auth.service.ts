import { HttpBadRequestError, HttpUnauthorizedError } from '@floteam/errors';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { HashingService } from '@services/hashing.service';
import { TokenService } from '@services/token.service';
import { UserService } from '@services/dynamoDB/entities/user.service';
import { JwtPayload, RequestUser, ResponseToken } from './auth.interfaces';

export class AuthService {
  private readonly hashingService = new HashingService();
  private readonly tokenService = new TokenService();
  private readonly userService = new UserService();

  public parseAndValidateIncomingBody(body?: string): RequestUser {
    if (!body) throw new HttpBadRequestError('Please, provide credentials');

    const candidate = JSON.parse(body);

    if (!candidate.email) throw new HttpBadRequestError('Please, provide email');
    if (!candidate.password) throw new HttpBadRequestError('Please, provide password');

    return { email: candidate.email, password: candidate.password };
  }

  public async signIn(candidate: RequestUser): Promise<ResponseToken> {
    try {
      const user = await this.userService.getProfileByEmail(candidate.email);

      await this.hashingService.verify(candidate.password, user.password);

      const token: string = await this.tokenService.sign({ email: user.email });

      return { token };
    } catch (error) {
      throw new HttpUnauthorizedError('Bad credentials');
    }
  }

  public async signUp(candidate: RequestUser): Promise<ResponseMessage> {
    try {
      await this.userService.create(candidate);
      return { message: 'Created' };
    } catch (error) {
      throw new HttpBadRequestError('Email already exist');
    }
  }

  public async authenticate(token: string): Promise<JwtPayload> {
    try {
      return this.tokenService.verify<JwtPayload>(token);
    } catch (error) {
      throw new HttpUnauthorizedError('Invalid token');
    }
  }
}
