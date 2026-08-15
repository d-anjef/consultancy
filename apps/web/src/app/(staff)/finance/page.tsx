'use client';

import { useState } from 'react';
import { Plus, AlertTriangle, Wallet, TrendingUp, FileText } from 'lucide-react';
import { useFinanceStats, useInvoices, usePayments } from '@/hooks/useFinance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoiceTable } from '@/components/finance/InvoiceTable';
import { PaymentTable } from '@/components/finance/PaymentTable';
import { CreateInvoiceDialog } from '@/components/finance/CreateInvoiceDialog';
import { StudentPickerDialog } from '@/components/students/StudentPickerDialog';
import { formatNPR } from '@/lib/utils/currency';
import type { Student } from '@/lib/api/students';

export default function FinancePage() {
  const [tab, setTab] = useState<'invoices' | 'payments' | 'overdue'>('invoices');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: stats } = useFinanceStats();

  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ limit: 20 });
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({ limit: 20 });
  const { data: overdueData, isLoading: overdueLoading } = useInvoices({
    overdue: true,
    limit: 20,
  });

  function handleStudentPicked(student: Student) {
    setSelectedStudent(student);
    setPickerOpen(false);
    setInvoiceOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Finance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invoices, payments, and financial overview
          </p>
        </div>
        <Button variant="accent" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Invoiced
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatNPR(stats.totalInvoiced)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalInvoices} invoices
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Paid
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-success">
              {formatNPR(stats.totalPaid)}
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
                <Wallet className="h-4 w-4 text-accent-foreground" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Outstanding
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {formatNPR(stats.totalOutstanding)}
            </p>
          </Card>

          <Card className="p-5 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Overdue
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-destructive">
              {formatNPR(stats.overdueAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdueCount} invoices
            </p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          <TabButton active={tab === 'invoices'} onClick={() => setTab('invoices')}>
            All Invoices
          </TabButton>
          <TabButton active={tab === 'payments'} onClick={() => setTab('payments')}>
            Payments
          </TabButton>
          <TabButton active={tab === 'overdue'} onClick={() => setTab('overdue')}>
            Overdue
            {stats && stats.overdueCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xxs font-medium">
                {stats.overdueCount}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      {tab === 'invoices' && (
        <InvoiceTable invoices={invoicesData?.items ?? []} isLoading={invoicesLoading} />
      )}
      {tab === 'payments' && (
        <PaymentTable payments={paymentsData?.items ?? []} isLoading={paymentsLoading} />
      )}
      {tab === 'overdue' && (
        <InvoiceTable invoices={overdueData?.items ?? []} isLoading={overdueLoading} />
      )}

      {/* Dialogs */}
      <StudentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleStudentPicked}
        title="Select Student for Invoice"
        description="Choose the student you want to create an invoice for."
      />
      {selectedStudent && (
        <CreateInvoiceDialog
          student={selectedStudent}
          open={invoiceOpen}
          onOpenChange={(open) => {
            setInvoiceOpen(open);
            if (!open) setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
      )}
    </button>
  );
}