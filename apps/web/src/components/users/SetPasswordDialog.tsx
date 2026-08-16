'use client';

import { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSetUserPassword } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

interface SetPasswordDialogProps {
  userId: string;
  userEmail: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'auto' | 'manual';

export function SetPasswordDialog({
  userId,
  userEmail,
  userName,
  open,
  onOpenChange,
}: SetPasswordDialogProps) {
  const [mode, setMode] = useState<Mode>('auto');
  const [manualPassword, setManualPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [showManualPwd, setShowManualPwd] = useState(false);

  // Result state (shown after success)
  const [result, setResult] = useState<{
    password: string;
    emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPassword = useSetUserPassword();

  useEffect(() => {
    if (open) {
      setMode('auto');
      setManualPassword('');
      setSendEmail(true);
      setShowManualPwd(false);
      setResult(null);
      setCopied(false);
      setError(null);
    }
  }, [open]);

  async function handleSubmit() {
    setError(null);

    // Validate manual password client-side
    if (mode === 'manual') {
      const p = manualPassword;
      if (p.length < 10) return setError('Password must be at least 10 characters');
      if (!/[A-Z]/.test(p)) return setError('Must contain uppercase letter');
      if (!/[a-z]/.test(p)) return setError('Must contain lowercase letter');
      if (!/[0-9]/.test(p)) return setError('Must contain a number');
      if (!/[^A-Za-z0-9]/.test(p)) return setError('Must contain a special character');
    }

    try {
      const res = (await setPassword.mutateAsync({
        id: userId,
        password: mode === 'manual' ? manualPassword : undefined,
        sendEmail,
      })) as {
        plainPassword: string;
        emailSent: boolean;
      };
      setResult({ password: res.plainPassword, emailSent: res.emailSent });
      if (res.emailSent) {
        toast.success(`Credentials emailed to ${userEmail}`);
      } else if (sendEmail) {
        toast.warning('Password set, but email failed. Copy password manually.');
      } else {
        toast.success('Password set successfully');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to set password');
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-accent" />
            Set Password & Activate
          </DialogTitle>
          <DialogDescription>
            For <span className="font-medium text-foreground">{userName}</span> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        {/* Result state */}
        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-success" />
                <p className="text-sm font-medium text-foreground">
                  Account Activated
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <p className="text-sm font-mono text-foreground">{userEmail}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm font-mono">
                      {result.password}
                    </code>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {sendEmail && (
              <div
                className={cn(
                  'rounded-md border p-3 flex items-start gap-2 text-xs',
                  result.emailSent
                    ? 'border-success/30 bg-success/5 text-foreground'
                    : 'border-destructive/30 bg-destructive/5 text-foreground',
                )}
              >
                {result.emailSent ? (
                  <>
                    <Mail className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    <p>Credentials emailed to {userEmail}</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <p>
                      Email failed to send. Please copy the password above and share it
                      manually.
                    </p>
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="accent" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Mode selector */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Password Method
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={cn(
                    'flex items-center gap-2 rounded-md border p-3 text-sm transition-colors',
                    mode === 'auto'
                      ? 'border-accent bg-accent-light'
                      : 'border-border hover:bg-secondary/50',
                  )}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Auto-Generate</p>
                    <p className="text-xxs text-muted-foreground">Strong random</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={cn(
                    'flex items-center gap-2 rounded-md border p-3 text-sm transition-colors',
                    mode === 'manual'
                      ? 'border-accent bg-accent-light'
                      : 'border-border hover:bg-secondary/50',
                  )}
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Type Manually</p>
                    <p className="text-xxs text-muted-foreground">Custom</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Manual password input */}
            {mode === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showManualPwd ? 'text' : 'password'}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showManualPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xxs text-muted-foreground">
                  10+ chars · uppercase · lowercase · number · special char
                </p>
              </div>
            )}

            {/* Send email checkbox */}
            <div className="flex items-start gap-2 rounded-md bg-secondary/30 p-3">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor="send-email" className="text-sm cursor-pointer">
                  Email credentials to user
                </Label>
                <p className="text-xxs text-muted-foreground">
                  Sends login details to {userEmail}
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleSubmit}
                isLoading={setPassword.isPending}
                loadingText="Setting…"
              >
                {mode === 'auto' ? 'Generate & Activate' : 'Set & Activate'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}