export interface UploadedDocument {
  path: string;
  mimeType: string;
  size: number;
  originalName: string;
}

export interface StorageProvider {
  // Property photos — public, returned as an immediately-usable URL.
  uploadImage(file: Express.Multer.File): Promise<string>;

  // Ownership documents — private; callers read them back via getSignedReadUrl().
  uploadDocument(file: Express.Multer.File, propertyId: string): Promise<UploadedDocument>;

  getSignedReadUrl(path: string): Promise<string>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
