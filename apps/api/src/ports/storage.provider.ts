import { UploadTarget } from "./domain";

export interface StorageProvider {
  createUploadTarget(params: {
    key: string;
    contentType: string;
    sizeBytes?: number;
    expiresInSeconds?: number;
  }): Promise<UploadTarget>;
  getPublicUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
