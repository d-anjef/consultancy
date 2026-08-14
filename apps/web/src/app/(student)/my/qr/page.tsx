'use client';

import { useState } from 'react';
import { QrCode, RotateCcw, Info } from 'lucide-react';
import { useMyQR, useRotateQR } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/LoadingState/LoadingState';

export default function MyQRPage() {
  const { data: qr, isLoading } = useMyQR();
  const rotate = useRotateQR();

  if (isLoading) return <LoadingState fullPage message="Loading your QR…" />;

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
            <div className="p-4 bg-white rounded-xl shadow-sm">
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

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Show this QR code to your teacher or scanner to mark your attendance.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => rotate.mutate()}
            isLoading={rotate.isPending}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Generate New QR
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-sm mx-auto border-accent/30 bg-accent-light">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-foreground">
            <p className="font-medium">Important</p>
            <ul className="mt-1 space-y-1 text-muted-foreground list-disc pl-4">
              <li>Keep your QR private — don't share it</li>
              <li>QR works for one scan per day</li>
              <li>If compromised, click "Generate New QR"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}