import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { StorageProvider } from "../../ports/storage.provider";
import { UploadTarget } from "../../ports/domain";
import { internalError } from "../../errors";

export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(supabaseUrl: string, serviceRoleKey: string, bucket: string = "cirkkl-media") {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.bucket = bucket;
  }

  async createUploadTarget(params: {
    key: string;
    contentType: string;
    sizeBytes?: number;
    expiresInSeconds?: number;
  }): Promise<UploadTarget> {
    const expiresIn = params.expiresInSeconds ?? 900;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(params.key);

    if (error || !data) {
      throw internalError(error?.message || "Failed to create signed upload target");
    }

    const publicUrl = this.getPublicUrlSync(params.key);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      key: params.key,
      uploadUrl: data.signedUrl,
      method: "PUT",
      headers: {
        "Content-Type": params.contentType,
      },
      publicUrl,
      expiresAt,
    };
  }

  private getPublicUrlSync(key: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async getPublicUrl(key: string): Promise<string> {
    return this.getPublicUrlSync(key);
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      throw internalError(error.message);
    }
  }
}
