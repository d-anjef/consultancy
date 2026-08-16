'use client';

import { QrCode, Info, Download } from 'lucide-react';
import { useMyQR } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';
import { useAuth } from '@/contexts/AuthContext';

export default function MyQRPage() {
  const { user } = useAuth();
  const { data: qr, isLoading } = useMyQR();

  if (isLoading) return <LoadingState fullPage message="Loading your QR…" />;

  function handleDownload() {
    if (!qr?.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qr.qrCodeDataUrl;
    link.download = `attendance-qr-${user?.profile.firstName ?? 'code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          My Account
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          My Attendance QR
        </h1>
      </div>

      <Card className="max-w-sm mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-base flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4 text-accent" />
            Your Attendance QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {qr?.qrCodeDataUrl ? (
            <div className="p-4 bg-white rounded-xl shadow-sm border border-border">
              <img
                src={qr.qrCodeDataUrl}
                alt="Your attendance QR code"
                className="w-64 h-64"
              />
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-secondary rounded-xl">
              <QrCode className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          {user && (
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {user.profile.firstName} {user.profile.lastName}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {user.email}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Show this QR code to your teacher or scanner to mark your attendance.
          </p>

          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Save to Device
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-sm mx-auto border-accent/30 bg-accent-light">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-medium">Important</p>
            <ul className="mt-1 space-y-1 text-muted-foreground list-disc pl-4">
              <li>This QR is unique to you — keep it private</li>
              <li>Save it to your phone for quick access</li>
              <li>If lost or compromised, contact admin to regenerate</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}