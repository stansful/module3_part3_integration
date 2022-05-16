import {
  APIGatewayAuthorizerSimpleResult,
  APIGatewayRequestAuthorizerHttpApiPayloadV2Event,
} from '@interfaces/api-gateway-authorizer.interface';
import { APIGatewayProxyHandlerV2, Handler } from 'aws-lambda';
import { errorHandler } from '@helper/http-api/error-handler';
import { createResponse } from '@helper/http-api/response';
import { log } from '@helper/logger';
import { AuthManager } from './auth.manager';

const authManager = new AuthManager();

export const signIn: APIGatewayProxyHandlerV2 = async (event) => {
  log('signIn method from auth handler, event:', event);

  try {
    const response = await authManager.signIn(event.body);

    return createResponse(200, response);
  } catch (error) {
    return errorHandler(error);
  }
};

export const signUp: APIGatewayProxyHandlerV2 = async (event) => {
  log('signUp method from auth handler, event:', event);

  try {
    const response = await authManager.signUp(event.body);

    return createResponse(201, response);
  } catch (error) {
    return errorHandler(error);
  }
};

export const authenticate: Handler<
  APIGatewayRequestAuthorizerHttpApiPayloadV2Event,
  APIGatewayAuthorizerSimpleResult
> = async (event) => {
  log('authenticate method from auth handler, event:', event);

  try {
    const candidate = await authManager.authenticate(event.headers?.authorization);

    return {
      isAuthorized: true,
      context: {
        email: candidate.email,
      },
    };
  } catch (error) {
    log('Failed to authenticate, at authenticate method in auth handler, error:', error);
    return {
      isAuthorized: false,
    };
  }
};
