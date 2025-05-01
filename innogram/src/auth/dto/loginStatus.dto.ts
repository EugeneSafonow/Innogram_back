export interface LoginStatusDto {
  id: string;
  username: string;
  email: string;
  avatarKey: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshTokenExpiresIn: number;
}
