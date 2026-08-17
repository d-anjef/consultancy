'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Bell, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Category = 'HOLIDAY' | 'EVENT' | 'NOTICE' | 'GENERAL';
type Audience = 'ALL_USERS' | 'ALL_STUDENTS' | 'ALL_STAFF' | 'BY_BRANCH' | 'BY_ROLE';

interface Branch {
  id: string;
  code: string;
  name: string;
}

const ROLE_OPTIONS = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'BRANCH_MANAGER', label: 'Branch Manager' },
  { code: 'COUNSELOR', label: 'Counselor' },
  { code: 'RECEPTIONIST', label: 'Receptionist' },
  { code: 'TEACHER', label: 'Teacher' },
  { code: 'STUDENT', label: 'Student' },
];

export function CreateAnnouncementDialog({ open, onOpenChange, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<Category>('GENERAL');
  const [audience, setAudience] = useState<Audience>('ALL_STUDENTS');
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [roleCodes, setRoleCodes] = useState<string[]>([]);
  const [includeStudents, setIncludeStudents] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: branchesData } = useQuery({
    queryKey: ['branches-list'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await api.get('/branches?limit=100');
      const payload = res?.data ?? res;
      return payload as { data: Branch[] };
    },
    enabled: open,
  });

  const branches: Branch[] = branchesData?.data ?? [];

  const previewMutation = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await api.post('/announcements/preview', {
        audience,
        branchIds: audience === 'BY_BRANCH' ? branchIds : undefined,
        roleCodes: audience === 'BY_ROLE' ? roleCodes : undefined,
        includeStudents,
      });
      const payload = (res?.data ?? res) as { data: { count: number } };
      return payload.data;
    },
    onSuccess: (data) => {
      setRecipientCount(data.count);
      setShowConfirm(true);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to preview';
      toast.error(msg);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await api.post('/announcements', {
        title,
        message,
        category,
        audience,
        branchIds: audience === 'BY_BRANCH' ? branchIds : undefined,
        roleCodes: audience === 'BY_ROLE' ? roleCodes : undefined,
        includeStudents,
        sendEmail,
        sendInApp,
      });
      return res?.data ?? res;
    },
    onSuccess: () => {
      toast.success('Announcement is being sent!');
      handleClose();
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to send announcement';
      toast.error(msg);
    },
  });

  function handleClose() {
    setTitle('');
    setMessage('');
    setCategory('GENERAL');
    setAudience('ALL_STUDENTS');
    setBranchIds([]);
    setRoleCodes([]);
    setIncludeStudents(true);
    setSendEmail(true);
    setSendInApp(true);
    setRecipientCount(null);
    setShowConfirm(false);
    onOpenChange(false);
  }

  function handlePreview() {
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }
    if (audience === 'BY_BRANCH' && branchIds.length === 0) {
      toast.error('Please select at least one branch');
      return;
    }
    if (audience === 'BY_ROLE' && roleCodes.length === 0) {
      toast.error('Please select at least one role');
      return;
    }
    if (!sendEmail && !sendInApp) {
      toast.error('Please enable at least one delivery channel');
      return;
    }

    previewMutation.mutate();
  }

  function toggleBranch(id: string) {
    setBranchIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  }

  function toggleRole(code: string) {
    setRoleCodes((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code],
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4 py-2">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">💬 General</SelectItem>
                  <SelectItem value="HOLIDAY">🎉 Holiday</SelectItem>
                  <SelectItem value="EVENT">📅 Event</SelectItem>
                  <SelectItem value="NOTICE">📢 Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Dashain Holiday Notice"
                maxLength={200}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement here..."
                rows={8}
                maxLength={5000}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/5000 characters</p>
            </div>

            <div>
              <Label>Send To *</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_STUDENTS">All Students</SelectItem>
                  <SelectItem value="ALL_STAFF">All Staff (no students)</SelectItem>
                  <SelectItem value="ALL_USERS">All Users (students + staff)</SelectItem>
                  <SelectItem value="BY_BRANCH">Specific Branches</SelectItem>
                  <SelectItem value="BY_ROLE">Specific Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === 'BY_BRANCH' && (
              <div className="pl-4 border-l-2 border-yellow-200 space-y-2">
                <Label className="text-sm">Select Branches</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {branches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                      <Checkbox
                        checked={branchIds.includes(b.id)}
                        onCheckedChange={() => toggleBranch(b.id)}
                      />
                      <span className="text-sm">
                        {b.name} <span className="text-gray-400">({b.code})</span>
                      </span>
                    </label>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm mt-2">
                  <Checkbox
                    checked={includeStudents}
                    onCheckedChange={(v) => setIncludeStudents(!!v)}
                  />
                  Include students in these branches
                </label>
              </div>
            )}

            {audience === 'BY_ROLE' && (
              <div className="pl-4 border-l-2 border-yellow-200 space-y-2">
                <Label className="text-sm">Select Roles</Label>
                <div className="space-y-1">
                  {ROLE_OPTIONS.map((r) => (
                    <label key={r.code} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2">
                      <Checkbox
                        checked={roleCodes.includes(r.code)}
                        onCheckedChange={() => toggleRole(r.code)}
                      />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {audience === 'ALL_USERS' && (
              <div className="pl-4 border-l-2 border-yellow-200">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={includeStudents}
                    onCheckedChange={(v) => setIncludeStudents(!!v)}
                  />
                  Include students (uncheck for staff-only)
                </label>
              </div>
            )}

            <div>
              <Label>Delivery Channels *</Label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Checkbox
                    checked={sendInApp}
                    onCheckedChange={(v) => setSendInApp(!!v)}
                  />
                  <Bell className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">In-app notification</p>
                    <p className="text-xs text-gray-500">Shows in notification bell</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Checkbox
                    checked={sendEmail}
                    onCheckedChange={(v) => setSendEmail(!!v)}
                  />
                  <Mail className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-gray-500">Sends to user&apos;s email inbox</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">Confirm Send</p>
                <p className="text-gray-700 mt-1">
                  This announcement will be sent to{' '}
                  <strong className="text-yellow-700">{recipientCount} recipient{recipientCount !== 1 ? 's' : ''}</strong>
                  {sendEmail && ' via email'}
                  {sendEmail && sendInApp && ' and'}
                  {sendInApp && ' in-app notification'}.
                </p>
                {recipientCount && recipientCount > 100 && (
                  <p className="text-yellow-700 mt-2 text-xs">
                    ⚠️ Sending to many recipients may take a few minutes due to email rate limits.
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Preview</p>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{message}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </div>
              {sendInApp && (
                <div className="flex items-center gap-1">
                  <Bell className="w-4 h-4" /> In-app
                </div>
              )}
              {sendEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!showConfirm ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={previewMutation.isPending}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {previewMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Preview Recipients
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Back to Edit
              </Button>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {sendMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Send Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}