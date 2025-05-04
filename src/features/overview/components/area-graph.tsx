// features/overview/components/area-graph.tsx
'use client';

import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { AreaGraphSkeleton } from './area-graph-skeleton';

// Define the data format
type UploadDataPoint = {
  date: string;
  documents: number;
  images: number;
  videos: number;
  others: number;
};

// Function to categorize files by extension
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

// Configuration for the chart
const chartConfig = {
  documents: {
    label: 'Documents',
    color: 'hsl(210, 100%, 50%)' // Blue
  },
  images: {
    label: 'Images',
    color: 'hsl(142, 71%, 45%)' // Green
  },
  videos: {
    label: 'Videos',
    color: 'hsl(0, 84%, 60%)' // Red
  },
  others: {
    label: 'Others',
    color: 'hsl(45, 93%, 47%)' // Amber
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const [chartData, setChartData] = useState<UploadDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.auth.user?.accountNo);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetch(`https://binfinity.zuselab.dev/user/backups?user_id=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch backups');
        return res.json();
      })
      .then((backups) => {
        // Process the data to get uploads by date and file type
        const uploadsByDate = new Map<string, UploadDataPoint>();

        // Initialize with the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

          uploadsByDate.set(dateStr, {
            date: dateStr,
            documents: 0,
            images: 0,
            videos: 0,
            others: 0
          });
        }

        // Count uploads by date and type
        backups.forEach((backup: any) => {
          const dateUploaded = new Date(backup.created_at)
            .toISOString()
            .split('T')[0];
          const category = getFileCategory(backup.file_name);

          if (!uploadsByDate.has(dateUploaded)) {
            uploadsByDate.set(dateUploaded, {
              date: dateUploaded,
              documents: 0,
              images: 0,
              videos: 0,
              others: 0
            });
          }

          const data = uploadsByDate.get(dateUploaded)!;
          data[category] += 1;
        });

        // Convert to array and sort by date (oldest to newest)
        const result = Array.from(uploadsByDate.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setChartData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching backup data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <AreaGraphSkeleton />;
  if (error) return <div>Error loading chart data: {error}</div>;

  // Format date range for display
  const formatDateRange = () => {
    if (chartData.length === 0) return 'No data available';
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    const start = new Date(chartData[0].date).toLocaleDateString(
      'en-US',
      options
    );
    const end = new Date(
      chartData[chartData.length - 1].date
    ).toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  };

  // Calculate total uploads and trend
  const totalUploads = chartData.reduce(
    (sum, day) => sum + day.documents + day.images + day.videos + day.others,
    0
  );

  // Calculate trend (comparing first half to second half of the period)
  const mid = Math.floor(chartData.length / 2);
  const firstHalf = chartData
    .slice(0, mid)
    .reduce(
      (sum, day) => sum + day.documents + day.images + day.videos + day.others,
      0
    );
  const secondHalf = chartData
    .slice(mid)
    .reduce(
      (sum, day) => sum + day.documents + day.images + day.videos + day.others,
      0
    );

  const trend =
    firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  const trendText =
    trend >= 0
      ? `Trending up by ${trend.toFixed(1)}%`
      : `Trending down by ${Math.abs(trend).toFixed(1)}%`;
  const TrendIcon = trend >= 0 ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Uploads by File Type</CardTitle>
        <CardDescription>Daily upload activity breakdown</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillDocuments' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-documents)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-documents)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillImages' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-images)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-images)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillVideos' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-videos)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-videos)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillOthers' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-others)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-others)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              }
            />
            <YAxis axisLine={false} tickLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='others'
              type='monotone'
              fill='url(#fillOthers)'
              stroke='var(--color-others)'
              stackId='a'
            />
            <Area
              dataKey='videos'
              type='monotone'
              fill='url(#fillVideos)'
              stroke='var(--color-videos)'
              stackId='a'
            />
            <Area
              dataKey='images'
              type='monotone'
              fill='url(#fillImages)'
              stroke='var(--color-images)'
              stackId='a'
            />
            <Area
              dataKey='documents'
              type='monotone'
              fill='url(#fillDocuments)'
              stroke='var(--color-documents)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {trendText} this period <TrendIcon className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {formatDateRange()} • {totalUploads} total uploads
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
