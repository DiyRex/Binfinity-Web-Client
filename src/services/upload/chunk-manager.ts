// services/upload/chunk-manager.ts

/**
 * Manages the chunking of files for upload
 */
export class ChunkManager {
    private file: File;
    private chunkSize: number;
    private cachedChunks: Map<number, ArrayBuffer> = new Map();
  
    constructor(file: File, chunkSize: number) {
      this.file = file;
      this.chunkSize = chunkSize;
    }
  
    /**
     * Get the total number of chunks for the file
     */
    getTotalChunks(): number {
      return Math.ceil(this.file.size / this.chunkSize);
    }
  
    /**
     * Get a specific chunk by index
     */
    async getChunk(chunkIndex: number): Promise<ArrayBuffer> {
      // Return cached chunk if available
      if (this.cachedChunks.has(chunkIndex)) {
        return this.cachedChunks.get(chunkIndex)!;
      }
  
      const start = chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      
      // Slice the file to get the chunk
      const chunk = this.file.slice(start, end);
      
      // Convert to ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(chunk);
      
      // Cache the chunk if it's small enough (optional - can be removed if memory is a concern)
      if (arrayBuffer.byteLength < 5 * 1024 * 1024) { // Only cache chunks smaller than 5MB
        this.cachedChunks.set(chunkIndex, arrayBuffer);
      }
      
      return arrayBuffer;
    }
  
    /**
     * Clear the chunk cache
     */
    clearCache(): void {
      this.cachedChunks.clear();
    }
  
    /**
     * Read a file blob as ArrayBuffer
     */
    private readFileAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as ArrayBuffer'));
          }
        };
        
        reader.onerror = () => {
          reject(reader.error || new Error('Unknown error reading file'));
        };
        
        reader.readAsArrayBuffer(blob);
      });
    }
  }