'use client';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import {
  IconFileText,
  IconImageInPicture,
  IconVideo,
  IconFile
} from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

const TOTAL_STORAGE_BYTES = 12 * 1024 * 1024 * 1024; // 12GB quota

function getFileCategory(
  filename: string
): 'documents' | 'images' | 'videos' | 'others' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(
      ext
    )
  )
    return 'documents';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext))
    return 'images';
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext))
    return 'videos';
  return 'others';
}

const CARD_META = {
  documents: {
    label: 'Documents',
    icon: <IconFileText className='text-blue-500' />,
    color: 'bg-blue-500'
  },
  images: {
    label: 'Images',
    icon: <IconImageInPicture className='text-green-500' />,
    color: 'bg-green-500'
  },
  videos: {
    label: 'Videos',
    icon: <IconVideo className='text-red-500' />,
    color: 'bg-red-500'
  },
  others: {
    label: 'Others',
    icon: <IconFile className='text-yellow-500' />,
    color: 'bg-yellow-500'
  }
};

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const [stats, setStats] = useState({
    documents: { count: 0, size: 0 },
    images: { count: 0, size: 0 },
    videos: { count: 0, size: 0 },
    others: { count: 0, size: 0 }
  });
  const user = useAuthStore((state) => state.auth.user);
  const userId = useAuthStore((state) => state.auth.user?.accountNo);

  useEffect(() => {
    if (!userId) return;
    fetch(`https://binfinity.zuselab.dev/user/backups?user_id=${userId}`)
      .then((res) => res.json())
      .then((backups: { file_name: string; size_bytes: number }[]) => {
        const result = {
          documents: { count: 0, size: 0 },
          images: { count: 0, size: 0 },
          videos: { count: 0, size: 0 },
          others: { count: 0, size: 0 }
        };
        for (const b of backups) {
          const cat = getFileCategory(b.file_name);
          result[cat].count += 1;
          result[cat].size += b.size_bytes;
        }
        setStats(result);
      });
  }, [userId]);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back {user?.email}👋
          </h2>
        </div>

        {/* DYNAMIC STORAGE CARDS */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {(['documents', 'images', 'videos', 'others'] as const).map(
            (type) => {
              const { count, size } = stats[type];
              const meta = CARD_META[type];
              const usedGB = size / 1024 ** 3;
              const percent = Math.round((size / TOTAL_STORAGE_BYTES) * 100);
              return (
                <Card key={type} className='rounded-xl border shadow'>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardDescription className='font-medium'>
                      {meta.label}
                    </CardDescription>
                    {meta.icon}
                  </CardHeader>
                  <CardTitle className='px-6 text-3xl font-bold'>
                    {count}
                  </CardTitle>
                  <CardFooter className='flex-col items-start gap-1.5 px-6 pb-4 text-sm'>
                    <div className='text-muted-foreground mb-1 text-sm'>
                      {usedGB.toFixed(1)} GB used
                    </div>
                    <div className='mb-1 h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                      <div
                        className={`h-full ${meta.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      {percent}% of storage used
                    </div>
                  </CardFooter>
                </Card>
              );
            }
          )}
        </div>

        {/* REST OF YOUR DASHBOARD */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          {/* <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div> */}
        </div>
      </div>
    </PageContainer>
  );
}
