// services/upload/utils.ts

/**
 * Calculate SHA-1 checksum for a file
 */
export async function calculateChecksum(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result;
          if (!buffer) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          // Use browser's SubtleCrypto API for hashing
          const hashBuffer = await crypto.subtle.digest('SHA-1', buffer as ArrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Format bytes to human-readable format
   */
  export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Generate a unique ID
   */
  export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Sleep for a specified time (useful for throttling or retries)
   */
  export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Retry a function with exponential backoff
   */
  export async function retry<T>(
    fn: () => Promise<T>, 
    maxRetries: number = 3, 
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const backoffDelay = delayMs * Math.pow(2, i);
        console.log(`Retrying after ${backoffDelay}ms...`);
        await sleep(backoffDelay);
      }
    }
    
    throw lastError;
  }