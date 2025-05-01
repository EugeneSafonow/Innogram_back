export interface JwtPayloadDto {
  username: string;
  email: string;
  userId?: string;
  tokenId?: string;
}
