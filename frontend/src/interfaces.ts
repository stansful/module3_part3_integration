interface User {
  email: string;
  password: string;
}

interface Token {
  token: string;
}

interface Gallery {
  metadata: {};
  path: string;
}

interface UploadMessage {
  key: string;
  uploadUrl: string;
}

interface ErrorMessage {
  errorMessage: string;
}

interface Message {
  message: string;
}

interface Metadata {
  width: number;
  height: number;
  fileSize: number;
  fileExtension: string;
}
