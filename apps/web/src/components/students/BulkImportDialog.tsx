'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

interface ImportResult {
  rowNumber: number;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  studentId?: string;
  studentName?: string;
  email?: string;
  error?: string;
}

interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: ImportResult[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [sendInvitations, setSendInvitations] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setSendInvitations(false);
    setIsUploading(false);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isUploading) return;
    onOpenChange(false);
    // Delay reset so animation completes
    setTimeout(resetState, 300);
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSummary(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleDownloadTemplate = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
      const response = await fetch(`${baseUrl}/students/import/template`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to download template');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chiba-student-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sendInvitations', String(sendInvitations));

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
      const response = await fetch(`${baseUrl}/students/import/bulk`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Import failed');
      }

      setSummary(result.data);
      qc.invalidateQueries({ queryKey: ['students'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    if (!summary) return;
    try {
      const response = await api.post<Blob>('/students/import/error-report', {
        summary,
      });
      // api.post returns unwrapped data, but for blob response we need fetch
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
      const res = await fetch(`${baseUrl}/students/import/error-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ summary }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'import-error-report.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const failed = summary?.results.filter((r) => r.status === 'FAILED') ?? [];
  const skipped = summary?.results.filter((r) => r.status === 'SKIPPED') ?? [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Import multiple students at once from an Excel or CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ─── STEP 1: Download Template ─── */}
          {!summary && (
            <div className="rounded-lg border border-border bg-neutral-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-light">
                  <FileSpreadsheet className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Step 1: Download the template
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Download our Excel template, fill it with your student data, then upload it below.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="mt-3"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Upload File ─── */}
          {!summary && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Step 2: Upload your filled file
              </Label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-accent bg-accent-light/50'
                    : file
                      ? 'border-success/50 bg-success/5'
                      : 'border-border bg-neutral-50/30 hover:border-accent/50 hover:bg-accent-light/20',
                  isUploading && 'opacity-50 cursor-not-allowed',
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                  className="hidden"
                  disabled={isUploading}
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-success" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xxs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Drag & drop your file here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse (.xlsx, .xls, .csv, max 10 MB)
                    </p>
                  </>
                )}
              </div>

              {/* Send invitations checkbox */}
              {file && !isUploading && (
                <label className="mt-4 flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendInvitations}
                    onChange={(e) => setSendInvitations(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Send invitation emails
                    </p>
                    <p className="text-xxs text-muted-foreground">
                      Each successfully imported student will receive an email to activate their account.
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* ─── Error message ─── */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ─── Uploading state ─── */}
          {isUploading && (
            <div className="flex items-center justify-center gap-3 py-8 rounded-lg bg-accent-light/30">
              <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
              <p className="text-sm text-foreground">
                Importing students... This may take a moment.
              </p>
            </div>
          )}

          {/* ─── Results ─── */}
          {summary && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-white p-3 text-center">
                  <p className="text-xxs uppercase tracking-wider text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                    {summary.total}
                  </p>
                </div>
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-center">
                  <p className="text-xxs uppercase tracking-wider text-success">
                    Success
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-success">
                    {summary.successful}
                  </p>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-center">
                  <p className="text-xxs uppercase tracking-wider text-warning">
                    Skipped
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
                    {summary.skipped}
                  </p>
                </div>
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <p className="text-xxs uppercase tracking-wider text-destructive">
                    Failed
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
                    {summary.failed}
                  </p>
                </div>
              </div>

              {/* Success message */}
              {summary.successful > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-success">
                      Successfully imported {summary.successful} student
                      {summary.successful !== 1 ? 's' : ''}
                    </p>
                    {sendInvitations && (
                      <p className="text-xxs text-muted-foreground mt-0.5">
                        Invitation emails are being sent in the background.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Skipped list */}
              {skipped.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <p className="text-sm font-semibold text-warning mb-2">
                    Skipped (Duplicates) — {skipped.length}
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {skipped.slice(0, 10).map((r) => (
                      <div key={r.rowNumber} className="text-xxs text-foreground">
                        Row {r.rowNumber}: {r.studentName ?? r.email} — {r.error}
                      </div>
                    ))}
                    {skipped.length > 10 && (
                      <p className="text-xxs text-muted-foreground italic">
                        ... and {skipped.length - 10} more (download report for full list)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Failed list */}
              {failed.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm font-semibold text-destructive mb-2">
                    Failed — {failed.length}
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {failed.slice(0, 10).map((r) => (
                      <div key={r.rowNumber} className="text-xxs text-foreground">
                        <span className="font-semibold">Row {r.rowNumber}:</span>{' '}
                        {r.studentName ?? r.email ?? 'Unknown'} — {r.error}
                      </div>
                    ))}
                    {failed.length > 10 && (
                      <p className="text-xxs text-muted-foreground italic">
                        ... and {failed.length - 10} more (download report for full list)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Download error report */}
              {(failed.length > 0 || skipped.length > 0) && (
                <Button
                  variant="outline"
                  onClick={handleDownloadErrorReport}
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Download Detailed Report
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-border">
          {summary ? (
            <>
              <Button variant="outline" onClick={resetState}>
                Import Another
              </Button>
              <Button variant="accent" onClick={handleClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleUpload}
                disabled={!file || isUploading}
                isLoading={isUploading}
                loadingText="Importing..."
              >
                <Upload className="h-4 w-4" />
                Import Students
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}