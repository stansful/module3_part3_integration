import { errorHandler } from '@helper/http-api/error-handler';
import { createResponse } from '@helper/http-api/response';
import { log } from '@helper/logger';
import { APIGatewayProxyHandlerV2, SQSHandler } from 'aws-lambda';
import { PexelsManager } from './pexels.manager';

const pexelsManager = new PexelsManager();

export const getPexelsPictures: APIGatewayProxyHandlerV2 = async (event) => {
  log('getPexelsPictures method from pexels handler, event:', event);

  try {
    const searchValue = event.queryStringParameters?.query;

    const response = await pexelsManager.getPexelsPictures(searchValue);

    return createResponse(200, response);
  } catch (error) {
    return errorHandler(error);
  }
};

export const sendToPictureQueue: APIGatewayProxyHandlerV2 = async (event) => {
  log('sendToPictureQueue method from pexels handler, event:', event);

  try {
    const body = event.body;

    const response = await pexelsManager.sendToPictureQueue(body);

    return createResponse(200, response);
  } catch (error) {
    return errorHandler(error);
  }
};

export const pictureProcessingUploading: SQSHandler = async (event) => {
  log('pictureProcessingUploading method from pexels handler, event:', event);

  await pexelsManager.processAndUploadPictures(event.Records);
};
