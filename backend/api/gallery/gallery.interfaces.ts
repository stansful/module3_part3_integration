export interface RequestGalleryQueryParams {
  page?: string;
  limit?: string;
  filter?: string;
}

export interface SanitizedQueryParams {
  limit: number;
  skip: number;
  uploadedByUser: boolean;
}

export interface Metadata {
  width: number;
  height: number;
  fileSize: number;
  fileExtension: string;
}

export interface PreSignedUploadResponse {
  key: string;
  uploadUrl: string;
}
