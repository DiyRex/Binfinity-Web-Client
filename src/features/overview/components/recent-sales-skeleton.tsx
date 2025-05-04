import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RecentSalesSkeleton() {
  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
        <Skeleton className='h-9 w-20' />
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-24' />
              </div>
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
