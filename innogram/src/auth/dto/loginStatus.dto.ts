export interface LoginStatusDto {
  id: string;
  username: string;
  email: string;
  avatarKey: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}
