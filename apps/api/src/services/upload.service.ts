import crypto from "node:crypto";
import { StorageProvider } from "../ports/storage.provider";
import { CallerContext } from "./auth.service";

export class UploadService {
  constructor(private readonly storageProvider: StorageProvider) {}

  async requestUpload(
    input: {
      targetType: "profile_image" | "event_image" | "payment_proof";
      fileName: string;
      contentType: string;
      sizeBytes: number;
    },
    caller: CallerContext
  ): Promise<any> {
    const ext = input.fileName.split(".").pop() || "bin";
    const fileId = crypto.randomUUID();

    let prefix = "misc";
    if (input.targetType === "profile_image") {
      prefix = `profiles/${caller.userId}`;
    } else if (input.targetType === "event_image") {
      prefix = `events/${caller.orgId || caller.userId}`;
    } else if (input.targetType === "payment_proof") {
      prefix = `payments/${caller.userId}`;
    }

    const key = `${prefix}/${fileId}.${ext}`;

    const target = await this.storageProvider.createUploadTarget({
      key,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });

    return {
      key: target.key,
      uploadUrl: target.uploadUrl,
      method: target.method,
      headers: target.headers || {},
      publicUrl: target.publicUrl,
      expiresAt: target.expiresAt.toISOString(),
    };
  }
}
