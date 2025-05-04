// pages/product-form.tsx
'use client';

import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/constants/mock-api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { DataTableDemo, Backup } from '@/components/data-table';
import { useAuthStore } from '@/stores/authStore';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const formSchema = z.object({
  image: z.any().refine((files) => files?.length == 1, 'File is required.'),
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  category: z.string(),
  price: z.number(),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.'
  })
});

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  // Use our file upload hook
  // const { uploadFiles, isUploading, progresses, error } = useFileUpload({
  //   onUploadComplete: (fileName) => {
  //     toast.success(`File ${fileName} uploaded successfully`);
  //   },
  //   onUploadError: (fileName, error) => {
  //     toast.error(`Failed to upload ${fileName}: ${error.message}`);
  //   }
  // });

  // State to track selected files
  const [backups, setBackups] = useState<Backup[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const defaultValues = {
    name: initialData?.name || '',
    category: initialData?.category || '',
    price: initialData?.price || 0,
    description: initialData?.description || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: defaultValues
  });

  // Enhanced file upload hook with callbacks for table updates
  const { uploadFiles, isUploading, progresses, error } = useFileUpload({
    onUploadComplete: async (fileName, backupId) => {
      try {
        // Fetch the newly created backup details
        const userId = useAuthStore.getState().auth.user?.accountNo;

        const tempBackup = {
          id: backupId,
          name: fileName,
          file_name: fileName,
          status: 'completed',
          size_bytes: selectedFiles[0]?.size || 0,
          created_at: new Date().toISOString()
        };

        // Add the new backup to the table data
        setBackups((prev) => [tempBackup, ...prev]);

        // Clear the file from the uploader
        setSelectedFiles([]);
        form.setValue('image', null);

        toast.success(`File ${fileName} uploaded successfully`);
        fetch(`https://binfinity.zuselab.dev/user/backups?user_id=${userId}`)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to refresh backups');
            return res.json();
          })
          .then((data) => setBackups(data))
          .catch((err) => {
            console.error('Failed to refresh backups:', err);
            // Don't show an error to the user since the upload was successful
          });
      } catch (error: any) {
        console.error('Error updating table:', error);
        toast.error(
          `File uploaded but failed to update table: ${error.message}`
        );
      }
    },
    onUploadError: (fileName, error) => {
      toast.error(`Failed to upload ${fileName}: ${error.message}`);
    }
  });

  useEffect(() => {
    const userId = useAuthStore.getState().auth.user?.accountNo;
    if (!userId) return;

    fetch(`https://binfinity.zuselab.dev/user/backups?user_id=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch backups');
        return res.json();
      })
      .then((data) => setBackups(data))
      .catch((err) => {
        console.error('Failed to load backups:', err);
        toast.error('Failed to load existing backups');
      });
  }, []);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form submitted');
    console.log('Selected files:', selectedFiles);
    try {
      // First upload the files
      if (selectedFiles.length > 0) {
        await uploadFiles(selectedFiles);
      }

      // Then handle the rest of the form submission
      toast.success('File submitted successfully');
      // Additional form submission logic would go here
    } catch (error) {
      toast.error('Failed to submit File');
      console.error('Submission error:', error);
    }
  }

  // Handle direct file upload without form submission
  async function handleDirectUpload(files: File[]) {
    return uploadFiles(files);
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='image'
              render={({ field }) => (
                <div className='space-y-6'>
                  <FormItem className='w-full'>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <FileUploader
                        value={field.value}
                        onValueChange={(files) => {
                          field.onChange(files);
                          setSelectedFiles(files || []);
                        }}
                        maxFiles={1}
                        disabled={isUploading}
                        progresses={progresses}
                        // Option 1: Use for direct upload when files are selected
                        // onUpload={handleDirectUpload}
                        autoUpload={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />

            {/* Show error message if upload fails */}
            {error && (
              <div className='text-sm text-red-500'>Upload error: {error}</div>
            )}

            <div className='text-center'>
              <Button
                type='button'
                disabled={isUploading || selectedFiles.length === 0}
                onClick={async () => {
                  if (selectedFiles.length > 0) {
                    try {
                      await uploadFiles(selectedFiles);
                      toast.success('Files uploaded successfully');
                    } catch (error) {
                      toast.error('Upload failed');
                      console.error('Upload error:', error);
                    }
                  }
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardContent>
        <DataTableDemo backups={backups} />
      </CardContent>
    </Card>
  );
}
