import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { IPhotoStorage } from '../domain/ports';

/** Desarrollo: disco local servido como estático en /media. */
export class LocalPhotoStorage implements IPhotoStorage {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(key: string, body: Buffer): Promise<void> {
    const path = join(this.rootDir, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}

/** Producción: S3 privado + CloudFront (OAC). El SDK se importa solo al usarse. */
export class S3PhotoStorage implements IPhotoStorage {
  private sdk?: Promise<{ client: import('@aws-sdk/client-s3').S3Client; sdk: typeof import('@aws-sdk/client-s3') }>;

  constructor(
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
  ) {}

  private load() {
    this.sdk ??= import('@aws-sdk/client-s3').then((sdk) => ({ client: new sdk.S3Client({}), sdk }));
    return this.sdk;
  }

  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    const { client, sdk } = await this.load();
    await client.send(
      new sdk.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable', // la clave es un UUID: nunca cambia
      }),
    );
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
