'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { useScanAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';

// Dynamic import to avoid SSR issues
type Html5QrcodeType = import('html5-qrcode').Html5Qrcode;

interface ScanLog {
  id: string;
  name: string;
  status: 'success' | 'error' | 'duplicate';
  message: string;
  timestamp: Date;
}

export default function QRScanPage() {
  const router = useRouter();
  const scan = useScanAttendance();
  const readerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const lastScannedRef = useRef<{ payload: string; time: number } | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);

  // Start scanner
  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        if (!readerRef.current || !mounted) return;

        const scanner = new Html5Qrcode('qr-reader', {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
        scannerRef.current = scanner;

        // Get cameras and pick back camera if available
        const devices = await Html5Qrcode.getCameras();
        if (devices.length === 0) {
          setCameraError('No camera found on this device.');
          return;
        }

        // Prefer back/environment camera on mobile
        const backCamera = devices.find((d) =>
          /back|rear|environment/i.test(d.label),
        );
        const cameraId = backCamera?.id ?? devices[0]!.id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          () => {
            /* ignore per-frame decode errors */
          },
        );

        if (mounted) setIsScanning(true);
      } catch (err) {
        console.error('QR scanner init failed:', err);
        setCameraError(
          err instanceof Error
            ? err.message
            : 'Failed to access camera. Please grant permission and reload.',
        );
      }
    }

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {
            /* ignore */
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScanSuccess(decodedText: string) {
    // Debounce — ignore the same payload within 3 seconds
    const now = Date.now();
    const last = lastScannedRef.current;
    if (last && last.payload === decodedText && now - last.time < 3000) {
      return;
    }
    lastScannedRef.current = { payload: decodedText, time: now };

    try {
      const result = await scan.mutateAsync({ qrPayload: decodedText });
      const name = `${result.user.firstName} ${result.user.lastName}`;

      const log: ScanLog = {
        id: `${result.id}-${now}`,
        name,
        status: 'success',
        message: `${result.status} · ${result.userType}`,
        timestamp: new Date(),
      };
      setScanLogs((prev) => [log, ...prev].slice(0, 10));
      toast.success(`${name} marked ${result.status.toLowerCase()}`);
    } catch (err: any) {
      const msg = err?.message ?? 'Scan failed';
      const isDuplicate = /already|duplicate/i.test(msg);

      const log: ScanLog = {
        id: `err-${now}`,
        name: 'Unknown',
        status: isDuplicate ? 'duplicate' : 'error',
        message: msg,
        timestamp: new Date(),
      };
      setScanLogs((prev) => [log, ...prev].slice(0, 10));

      if (isDuplicate) {
        toast.info(msg);
      } else {
        toast.error(msg);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/attendance')}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Attendance
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            QR Scanner
          </h1>
          {isScanning && (
            <Badge variant="success" className="text-xxs">
              <Camera className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Point your camera at a student or teacher's QR code
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Camera
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cameraError ? (
              <div className="text-center py-8 space-y-3">
                <XCircle className="h-8 w-8 text-destructive mx-auto" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Camera Unavailable
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    {cameraError}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  id="qr-reader"
                  ref={readerRef}
                  className="rounded-md overflow-hidden bg-black/5 aspect-square max-w-md mx-auto"
                />
                {!isScanning && (
                  <p className="text-xs text-center text-muted-foreground">
                    Requesting camera access…
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {scanLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No scans yet. Point the camera at a QR code.
              </div>
            ) : (
              <div className="space-y-2">
                {scanLogs.map((log) => (
                  <div
                    key={log.id}
                    className={
                      'flex items-start gap-3 rounded-md border p-3 ' +
                      (log.status === 'success'
                        ? 'border-success/30 bg-success/5'
                        : log.status === 'duplicate'
                        ? 'border-accent/30 bg-accent-light'
                        : 'border-destructive/30 bg-destructive/5')
                    }
                  >
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle
                        className={
                          'h-4 w-4 shrink-0 mt-0.5 ' +
                          (log.status === 'duplicate'
                            ? 'text-accent-foreground'
                            : 'text-destructive')
                        }
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {log.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.message}
                      </p>
                      <p className="text-xxs text-muted-foreground mt-0.5">
                        {formatDistance(log.timestamp, new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}