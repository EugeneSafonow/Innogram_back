export interface LoginStatusDto {
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}
