import { StorageProvider } from "../../ports/storage.provider";
import { UploadTarget } from "../../ports/domain";

export class MemoryStorageProvider implements StorageProvider {
  private files: Set<string> = new Set();

  async createUploadTarget(params: {
    key: string;
    contentType: string;
    sizeBytes?: number;
    expiresInSeconds?: number;
  }): Promise<UploadTarget> {
    this.files.add(params.key);
    return {
      key: params.key,
      uploadUrl: `https://mock-storage.local/${params.key}`,
      method: "PUT",
      headers: { "Content-Type": params.contentType },
      publicUrl: `https://mock-storage.local/public/${params.key}`,
      expiresAt: new Date(Date.now() + (params.expiresInSeconds ?? 900) * 1000),
    };
  }

  async getPublicUrl(key: string): Promise<string> {
    return `https://mock-storage.local/public/${key}`;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}
