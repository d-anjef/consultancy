'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials } from '@/lib/utils/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/data/constants';

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push(ROUTES.LOGIN);
  };

  const isStudent = user.role.code === 'STUDENT';
  const fullName = `${user.profile.firstName} ${user.profile.lastName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1.5 h-9 rounded-full px-1 pr-2 hover:bg-secondary"
        >
          <Avatar className="h-7 w-7">
            {user.profile.profilePhotoUrl && (
              <AvatarImage
                src={user.profile.profilePhotoUrl}
                alt={fullName}
              />
            )}
            <AvatarFallback className="text-xxs font-bold">
              {getInitials(user.profile.firstName, user.profile.lastName)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* User info header */}
        <div className="flex items-center gap-3 px-2 py-2.5">
          <Avatar className="h-10 w-10">
            {user.profile.profilePhotoUrl && (
              <AvatarImage
                src={user.profile.profilePhotoUrl}
                alt={fullName}
              />
            )}
            <AvatarFallback className="text-xs font-bold">
              {getInitials(user.profile.firstName, user.profile.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {fullName}
            </p>
            <p className="truncate text-xxs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        {/* Role & Branch badges */}
        <div className="px-2 pb-2 space-y-1">
          <div className="flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5">
            <span className="text-xxs text-muted-foreground">Role</span>
            <span className="text-xxs font-semibold text-foreground">
              {user.role.displayName}
            </span>
          </div>
          {user.branch && (
            <div className="flex items-center justify-between rounded-md bg-secondary/50 px-2 py-1.5">
              <span className="text-xxs text-muted-foreground">Branch</span>
              <span className="text-xxs font-semibold text-foreground truncate ml-2">
                {user.branch.name}
              </span>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            router.push(isStudent ? ROUTES.MY_PROFILE : '/profile')
          }
        >
          <UserIcon />
          Profile
        </DropdownMenuItem>

        {!isStudent && (
          <>
            <DropdownMenuItem onClick={() => router.push('/profile/security')}>
              <ShieldCheck />
              Security
            </DropdownMenuItem>
            {(user.role.code === 'SUPER_ADMIN' || user.role.code === 'ADMIN') && (
              <DropdownMenuItem onClick={() => router.push(ROUTES.SETTINGS)}>
                <Settings />
                Settings
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}