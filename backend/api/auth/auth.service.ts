import { HttpBadRequestError } from '@floteam/errors';
import { ResponseMessage } from '@interfaces/response-message.interface';
import { RequestUser, ResponseToken } from './auth.interfaces';

export class AuthService {
  public parseAndValidateIncomingBody(body?: string): RequestUser {
    if (!body) throw new HttpBadRequestError('Please, provide credentials');

    const candidate = JSON.parse(body);

    if (!candidate.email) throw new HttpBadRequestError('Please, provide email');
    if (!candidate.password) throw new HttpBadRequestError('Please, provide password');

    return { email: candidate.email, password: candidate.password };
  }

  public signIn(token: string): ResponseToken {
    return { token };
  }

  public signUp(): ResponseMessage {
    return { message: 'Created' };
  }
}
