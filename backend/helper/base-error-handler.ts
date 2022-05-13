import { HttpError } from '@floteam/errors/http/http-error';
import { RuntimeError } from '@floteam/errors/runtime/runtime-error';
import { convertToHttpError } from '@floteam/errors/util';
import { log } from '@helper/logger';
import { AxiosError } from 'axios';

/**
 * Base error handler. Convert any error to an HttpError.
 *
 * @param {Error | HttpError | AxiosError | RuntimeError} caughtError
 * @returns {HttpError}
 */
export function baseErrorHandler(caughtError: Error | HttpError | AxiosError | RuntimeError): HttpError {
  log('caught error ', caughtError);

  if (!(caughtError instanceof HttpError)) {
    /**
     * It means that error was unexpected and can have unpredictable structure
     * For example, Axios exceptions have different structure
     * Also, we can send all unexpected exceptions to Sentry here
     */
    log('This error was not generated by us. We should extract the statusCode, name and message here');
    return convertToHttpError(caughtError);
  }

  return caughtError;
}
