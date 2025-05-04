// hooks/useFileUpload.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { uploadService, FileUploadStatus } from '@/services/upload';

interface UseFileUploadOptions {
  onUploadComplete?: (fileName: string, backupId: string) => void;
  onUploadError?: (fileName: string, error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  // State for tracking uploads
  const [uploads, setUploads] = useState<Record<string, FileUploadStatus>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store progresses for the FileUploader component
  const [progresses, setProgresses] = useState<Record<string, number>>({});

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // IMPORTANT: Reset isMounted to true whenever the hook is initialized
  // This ensures it's properly set after any remounting
  useEffect(() => {
    console.log('Setting isMounted to true on hook initialization');
    isMounted.current = true;

    return () => {
      console.log('Cleanup: Setting isMounted to false');
      isMounted.current = false;
    };
  }, []);

  // Progress tracking interval
  useEffect(() => {
    if (!isUploading) return;

    const intervalId = setInterval(() => {
      if (!isMounted.current) {
        console.log('Component unmounted, clearing interval');
        clearInterval(intervalId);
        return;
      }

      const currentProgresses = uploadService.getAllProgresses();
      setProgresses(currentProgresses);

      // Update uploads status based on progress
      setUploads((prev) => {
        const updated = { ...prev };
        Object.entries(currentProgresses).forEach(([fileName, progress]) => {
          if (updated[fileName]) {
            updated[fileName] = {
              ...updated[fileName],
              progress
            };
          }
        });
        return updated;
      });
    }, 300);

    return () => clearInterval(intervalId);
  }, [isUploading]);

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File) => {
      console.log(`Starting upload of file: ${file.name} (im in hook)`);
      console.log('isMounted.current value:', isMounted.current);

      // IMPORTANT: We'll force it to continue even if isMounted is false
      // This is safe because we're in an active render cycle
      if (isMounted.current === false) {
        console.log('isMounted is false but continuing upload anyway');
        // Don't return early
      }

      setIsUploading(true);
      setError(null);
      console.log('States updated');

      // Initialize file status
      setUploads((prev) => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          fileSize: file.size,
          progress: 0,
          status: 'uploading',
          startTime: new Date()
        }
      }));

      console.log('File status initialized, starting upload');

      try {
        console.log('Before uploading file');
        const backupId = await uploadService.uploadFile(file);
        console.log('File upload completed successfully');

        // Only update state if still relevant
        if (isMounted.current) {
          setUploads((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              progress: 100,
              status: 'completed',
              endTime: new Date()
            }
          }));

          // Call completion callback
          options.onUploadComplete?.(file.name, backupId);
        }
      } catch (err) {
        console.error('Upload error:', err);

        // Only update state if still relevant
        if (isMounted.current) {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);

          setUploads((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              status: 'failed',
              error: errorMessage,
              endTime: new Date()
            }
          }));

          // Call error callback
          if (err instanceof Error) {
            options.onUploadError?.(file.name, err);
          }
        }
      } finally {
        // Only update state if still relevant
        if (isMounted.current) {
          setIsUploading((prev) => {
            const allFinished = Object.values(uploads).every(
              (upload) =>
                upload.status === 'completed' || upload.status === 'failed'
            );
            return !allFinished;
          });
        }
      }
    },
    [options, uploads]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    async (files: File[]) => {
      console.log('uploadFiles called with', files.length, 'files');
      // Process files sequentially to avoid memory issues
      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  // Rest of your functions (cancelUpload, resetUploads) remain the same...

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    uploads,
    progresses,
    error
  };
}
