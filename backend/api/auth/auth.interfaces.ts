export interface RequestUser {
  email: string;
  password: string;
}

export type JwtPayload = Omit<RequestUser, 'password'>;
