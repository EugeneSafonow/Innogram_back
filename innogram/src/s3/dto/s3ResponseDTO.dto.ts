import { Readable } from 'stream';

export class S3ResponseDTO {
  stream: Readable;
  contentType: string;
}
