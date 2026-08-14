'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-secondary"
        >
          <Avatar className="h-7 w-7">
            {user.profile.profilePhotoUrl && (
              <AvatarImage
                src={user.profile.profilePhotoUrl}
                alt={`${user.profile.firstName} ${user.profile.lastName}`}
              />
            )}
            <AvatarFallback>
              {getInitials(user.profile.firstName, user.profile.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start leading-tight text-left">
            <span className="text-xs font-semibold text-foreground">
              {user.profile.firstName} {user.profile.lastName}
            </span>
            <span className="text-xxs text-muted-foreground">
              {user.role.displayName}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-foreground">
            {user.profile.firstName} {user.profile.lastName}
          </p>
          <p className="text-xxs text-muted-foreground truncate">{user.email}</p>
          {user.branch && (
            <p className="text-xxs text-muted-foreground mt-0.5">
              {user.branch.name}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(isStudent ? ROUTES.MY_PROFILE : '/users/me')}
        >
          <UserIcon />
          Profile
        </DropdownMenuItem>
        {!isStudent && (
          <>
            <DropdownMenuItem onClick={() => router.push('/settings/security')}>
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
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}