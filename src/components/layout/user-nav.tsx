'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useRouter } from 'next/navigation';
export function UserNav() {
  const router = useRouter();
  // if (user) {
  //   return (
  //     <DropdownMenu>
  //       <DropdownMenuTrigger asChild>
  //         <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
  //           <UserAvatarProfile user={user} />
  //         </Button>
  //       </DropdownMenuTrigger>
  //       <DropdownMenuContent
  //         className='w-56'
  //         align='end'
  //         sideOffset={10}
  //         forceMount
  //       >
  //         <DropdownMenuLabel className='font-normal'>
  //           <div className='flex flex-col space-y-1'>
             
  //           </div>
  //         </DropdownMenuLabel>
  //         <DropdownMenuSeparator />
  //         <DropdownMenuGroup>
  //           <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
  //             Profile
  //           </DropdownMenuItem>
  //           <DropdownMenuItem>Billing</DropdownMenuItem>
  //           <DropdownMenuItem>Settings</DropdownMenuItem>
  //           <DropdownMenuItem>New Team</DropdownMenuItem>
  //         </DropdownMenuGroup>
  //         <DropdownMenuSeparator />
  //         <DropdownMenuItem>
  //         </DropdownMenuItem>
  //       </DropdownMenuContent>
  //     </DropdownMenu>
  //   );
  // }
}
