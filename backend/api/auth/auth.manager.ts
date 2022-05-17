import { HttpBadRequestError, HttpUnauthorizedError } from '@floteam/errors';
import { log } from '@helper/logger';
import { UserService } from '@services/dynamoDB/entities/user.service';
import { HashingService } from '@services/hashing.service';
import { TokenService } from '@services/token.service';
import { JwtPayload } from './auth.interfaces';
import { AuthService } from './auth.service';

export class AuthManager {
  private readonly authService: AuthService;
  private readonly userService: UserService;
  private readonly hashingService: HashingService;
  private readonly tokenService: TokenService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.hashingService = new HashingService();
    this.tokenService = new TokenService();
  }

  public async signIn(body?: string) {
    try {
      const candidate = this.authService.parseAndValidateIncomingBody(body);
      const user = await this.userService.getProfileByEmail(candidate.email);
      await this.hashingService.verify(candidate.password, user.password);
      const token: string = await this.tokenService.sign({ email: user.email });
      return this.authService.signIn(token);
    } catch (error) {
      log('Failed to signIn, at signIn in auth manager, error:', error);
      throw new HttpUnauthorizedError('Bad credentials');
    }
  }

  public async signUp(body?: string) {
    try {
      const candidate = this.authService.parseAndValidateIncomingBody(body);
      await this.userService.create(candidate);
      return this.authService.signUp();
    } catch (error) {
      log('Failed to signUp, at signUp in auth manager, error:', error);
      throw new HttpBadRequestError('Email already exist');
    }
  }

  public async authenticate(token?: string) {
    if (!token) {
      throw new HttpUnauthorizedError('Please, provide token');
    }

    try {
      return this.tokenService.verify<JwtPayload>(token);
    } catch (error) {
      throw new HttpUnauthorizedError('Invalid token');
    }
  }
}
