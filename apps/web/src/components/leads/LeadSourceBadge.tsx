import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeadSource } from '@/lib/api/leads';
import {
  Facebook,
  Instagram,
  MessageCircle,
  Globe,
  Users,
  Phone,
  FileText,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface LeadSourceBadgeProps {
  source: LeadSource;
  className?: string;
}

const SOURCE_CONFIG: Record<LeadSource, { label: string; icon: LucideIcon }> = {
  WEBSITE: { label: 'Website', icon: Globe },
  FACEBOOK: { label: 'Facebook', icon: Facebook },
  INSTAGRAM: { label: 'Instagram', icon: Instagram },
  MESSENGER: { label: 'Messenger', icon: MessageCircle },
  WALK_IN: { label: 'Walk-in', icon: Building2 },
  REFERRAL: { label: 'Referral', icon: Users },
  PHONE: { label: 'Phone', icon: Phone },
  GOOGLE_FORM: { label: 'Google Form', icon: FileText },
  OTHER: { label: 'Other', icon: FileText },
};

export function LeadSourceBadge({ source, className }: LeadSourceBadgeProps) {
  const config = SOURCE_CONFIG[source] ?? { label: source, icon: FileText };
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}