// services/upload/api.ts

import axios from 'axios';
import { config } from './upload-service';
import { BackupStatus, InitiateBackupRequest, InitiateBackupResponse } from './types';
import { keycloakService } from '../keycloak/keycloak';

/**
 * API functions for the upload service
 */
export const api = {
  /**
   * Initiate backup and get upload URLs
   */
  async initiateBackup(backupRequest: InitiateBackupRequest): Promise<InitiateBackupResponse> {
    const token = keycloakService.getToken();
    try {
      console.log('Starting backup initiation with token:', token ? 'Available' : 'Not available');

      const response = await axios.post(
        `${config.apiBaseUrl}/api/backups/initiate`,
        backupRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-ID': config.userId,
            'Content-Type': 'application/json',
            'X-Encrypted-Chunk': 'true',
            'X-Encryption-Method': 'aes-256-cbc+rsa',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to initiate backup:', error);
      throw new Error('Failed to initiate backup');
    }
  },

  /**
   * Upload an encrypted chunk
   */
  async uploadChunk(
    uploadUrl: string, 
    encryptedData: ArrayBuffer,
    abortSignal?: AbortSignal
  ): Promise<any> {
    try {
      const response = await axios.post(
        uploadUrl,
        encryptedData,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `Bearer ${config.authToken}`,
            'X-Encrypted-Chunk': 'true',
            'X-Encryption-Method': 'aes-256-cbc+rsa',
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          signal: abortSignal,
        }
      );
      
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Upload canceled');
        throw new Error('Upload canceled');
      }
      
      console.error('Failed to upload chunk:', error);
      throw new Error('Failed to upload chunk');
    }
  },

  /**
   * Check backup status
   */
  async getBackupStatus(backupId: string): Promise<BackupStatus> {
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/api/v1/storage/backup/${backupId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${config.authToken}`,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to get backup status:', error);
      throw new Error('Failed to get backup status');
    }
  },
};