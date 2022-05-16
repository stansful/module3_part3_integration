import { HttpBadRequestError, HttpUnauthorizedError } from '@floteam/errors';
import { log } from '@helper/logger';
import { AuthService } from './auth.service';

export class AuthManager {
  private readonly authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public signIn(body?: string) {
    try {
      const candidate = this.authService.parseAndValidateIncomingBody(body);
      return this.authService.signIn(candidate);
    } catch (error) {
      log('Failed to signIn, at signIn in auth manager, error:', error);
      throw new HttpUnauthorizedError(error.message);
    }
  }

  public signUp(body?: string) {
    try {
      const candidate = this.authService.parseAndValidateIncomingBody(body);
      return this.authService.signUp(candidate);
    } catch (error) {
      log('Failed to signUp, at signUp in auth manager, error:', error);
      throw new HttpBadRequestError(error.message);
    }
  }

  public async authenticate(token?: string) {
    if (!token) {
      throw new HttpUnauthorizedError('Please, provide token');
    }
    return this.authService.authenticate(token);
  }
}
