// services/upload/upload-service.ts

import { api } from './api';
import { ChunkManager } from './chunk-manager';
import { encryptChunk } from './encryption-utils';
import { calculateChecksum } from './utils';
import { InitiateBackupResponse } from './types';
import { useAuthStore } from '@/stores/authStore';

// Configuration (hardcoded for now as requested)
export const config = {
  apiBaseUrl: 'https://binfinity.zuselab.dev',
  // apiBaseUrl: 'http://5.196.168.50:6080',
  chunkSize: 1048576, // 1MB

  get userId() {
    const user = useAuthStore.getState().auth.user;
    return user?.accountNo || '';
  },
  get authToken() {
    return useAuthStore.getState().auth.accessToken;
  }
};

/**
 * Service to handle file uploads with chunking and encryption
 */
export class FileUploadService {
  private progresses: Record<string, number> = {};
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Get current progress for a specific file
   */
  getProgress(fileName: string): number {
    return this.progresses[fileName] || 0;
  }

  /**
   * Get all current file upload progresses
   */
  getAllProgresses(): Record<string, number> {
    return { ...this.progresses };
  }

  /**
   * Upload a file with chunking and encryption
   */
  async uploadFile(file: File): Promise<string> {
    try {
      console.log(`Starting upload of file: ${file.name}`);

      // Reset progress
      this.progresses[file.name] = 0;

      // Create abort controller for this upload
      const abortController = new AbortController();
      this.abortControllers.set(file.name, abortController);

      // Calculate file info
      const fileSize = file.size;
      const checksum = await calculateChecksum(file);
      const numChunks = Math.ceil(fileSize / config.chunkSize);

      console.log(`File size: ${fileSize} bytes`);
      console.log(`Checksum: ${checksum}`);
      console.log(`Number of chunks: ${numChunks}`);

      // Initialize chunk manager
      const chunkManager = new ChunkManager(file, config.chunkSize);

      // Step 1: Initiate backup and get upload URLs
      console.log('Initiating backup...');
      const initResponse = await api.initiateBackup({
        filename: file.name,
        num_chunks: numChunks,
        chunk_size: config.chunkSize,
        total_size: fileSize,
        checksum,
        addon_type: 'plugin' // Adjust based on your file type
      });

      console.log('Backup initiated successfully');
      console.log(`Backup ID: ${initResponse.backup_id}`);

      const uploadUrls = initResponse.presigned_urls;
      const publicKeyBase64 = initResponse.public_key;

      // Step 2: Upload all chunks
      console.log('Starting chunk uploads...');
      let uploadedChunks = 0;

      for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
        // Check if upload was aborted
        if (abortController.signal.aborted) {
          throw new Error('Upload aborted');
        }

        const uploadUrl = uploadUrls[chunkIndex];
        console.log(`Uploading chunk ${chunkIndex + 1}/${numChunks}...`);

        // Get the chunk data
        const chunkData = await chunkManager.getChunk(chunkIndex);

        // Encrypt the chunk before uploading
        console.log(`Encrypting chunk ${chunkIndex + 1}...`);
        const encryptedData = await encryptChunk(publicKeyBase64, chunkData);
        console.log(
          `Encryption complete. Encrypted size: ${encryptedData.byteLength} bytes`
        );

        // Upload the encrypted chunk
        await api.uploadChunk(uploadUrl, encryptedData, abortController.signal);

        uploadedChunks++;

        // Update progress
        const progress = Math.round((uploadedChunks / numChunks) * 100);
        this.progresses[file.name] = progress;
        console.log(`Progress: ${progress}%`);
      }

      console.log('✅ Backup completed successfully!');

      // Final status check
      const backupId = initResponse.backup_id;
      const statusResponse = await api.getBackupStatus(backupId);
      console.log('Final backup status:', statusResponse);

      // Cleanup
      this.abortControllers.delete(file.name);

      return backupId;
    } catch (error) {
      console.error('Upload failed:', error);
      this.abortControllers.delete(file.name);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[]): Promise<string[]> {
    console.log('uploadFiles Triggerd !');
    const promises = files.map((file) => this.uploadFile(file));
    const backupIds = await Promise.all(promises);

    return backupIds;
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(fileName: string): boolean {
    const controller = this.abortControllers.get(fileName);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(fileName);
      return true;
    }
    return false;
  }
}

// Create and export a singleton instance
export const uploadService = new FileUploadService();
