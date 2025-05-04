// features/overview/components/recent-backups.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { IconBrandGithub } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';

type Backup = {
  id: string;
  name: string;
  size_bytes: number;
  created_at: string;
  status: string;
};

export function RecentSales() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const navigate = useNavigate();
  const userId = useAuthStore((state) => state.auth.user?.accountNo);

  useEffect(() => {
    if (!userId) return;

    const fetchBackups = async () => {
      try {
        const response = await fetch(
          `https://binfinity.zuselab.dev/user/backups?user_id=${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch backups');
        const data = await response.json();
        setBackups(
          data
            .sort(
              (a: Backup, b: Backup) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, 5)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load backups');
      } finally {
        setLoading(false);
      }
    };

    fetchBackups();
  }, [userId]);

  const formatSize = (bytes: number) => {
    const megabytes = bytes / (1024 * 1024);
    return `${megabytes.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Recent Backups</CardTitle>
          <CardDescription>Latest 5 backup files</CardDescription>
        </div>
        <Button variant='outline' size='sm'>
          <Link
            href='/dashboard/backup'
            rel='noopener noreferrer'
            target='_self'
            className='dark:text-foreground'
          >
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className='py-4 text-center text-red-500'>{error}</div>
        ) : (
          <div className='space-y-4'>
            {backups.map((backup) => (
              <div
                key={backup.id}
                className='flex items-center justify-between'
              >
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>{backup.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {formatDate(backup.created_at)}
                  </p>
                </div>
                <div className='text-sm font-medium'>
                  {formatSize(backup.size_bytes)}
                </div>
              </div>
            ))}
            {backups.length === 0 && (
              <div className='text-muted-foreground py-4 text-center'>
                No backups found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
