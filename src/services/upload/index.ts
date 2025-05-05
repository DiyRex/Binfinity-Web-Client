// services/upload/index.ts

// Export main service
export { uploadService, FileUploadService, config } from './upload-service';

// Export utility functions
export { calculateChecksum, formatBytes, retry } from './utils';

// Export types
export type {
  InitiateBackupRequest,
  InitiateBackupResponse,
  BackupStatus,
  FileUploadStatus,
  UploadOptions,
  UploadResult
} from './types';

// Export API (in case it needs to be used directly)
export { api } from './api';

// Export ChunkManager (in case it needs to be used directly)
export { ChunkManager } from './chunk-manager';

// Export encryption utilities
export { encryptChunk } from './encryption-utils';