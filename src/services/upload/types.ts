// services/upload/types.ts

/**
 * Request parameters for initiating a backup
 */
export interface InitiateBackupRequest {
    filename: string;
    num_chunks: number;
    chunk_size: number;
    total_size: number;
    checksum: string;
    addon_type: string;
  }
  
  /**
   * Response from initiating a backup
   */
  export interface InitiateBackupResponse {
    backup_id: string;
    presigned_urls: string[];
    public_key: string;
    all_received?: boolean;
  }
  
  /**
   * Backup status response
   */
  export interface BackupStatus {
    backup_id: string;
    status: 'pending' | 'completed' | 'failed';
    chunks_received: number;
    total_chunks: number;
    all_received: boolean;
    error?: string;
  }
  
  /**
   * File upload status
   */
  export interface FileUploadStatus {
    fileName: string;
    fileSize: number;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'canceled';
    error?: string;
    startTime?: Date;
    endTime?: Date;
  }
  
  /**
   * Upload options
   */
  export interface UploadOptions {
    onProgress?: (fileName: string, progress: number) => void;
    onComplete?: (fileName: string) => void;
    onError?: (fileName: string, error: Error) => void;
    chunkSize?: number;
    maxRetries?: number;
    concurrentChunks?: number;
  }
  
  /**
   * Upload result
   */
  export interface UploadResult {
    successful: boolean;
    fileName: string;
    backupId?: string;
    error?: string;
  }