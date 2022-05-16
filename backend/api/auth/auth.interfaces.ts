export interface RequestUser {
  email: string;
  password: string;
}

export interface ResponseToken {
  token: string;
}

export type JwtPayload = Omit<RequestUser, 'password'>;
