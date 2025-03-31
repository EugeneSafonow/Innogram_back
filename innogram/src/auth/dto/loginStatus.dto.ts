export interface LoginStatusDto {
  id: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}
