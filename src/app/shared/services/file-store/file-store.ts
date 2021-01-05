import { MimeType } from '../../../utils/mime-type';

export interface FileStore {
  read(index: string): Promise<string>;
  write(base64: string, mimeType: MimeType): Promise<string>;
  delete(index: string): Promise<string>;
  exists(index: string): Promise<boolean>;
  clear(): Promise<void>;
  drop(): Promise<void>;
}
