'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  financeApi,
  type Invoice,
  type Payment,
  type ListInvoicesParams,
  type ListPaymentsParams,
  type CreateInvoiceInput,
  type CreatePaymentInput,
} from '@/lib/api/finance';

export function useFinanceStats() {
  return useQuery({
    queryKey: ['finance', 'stats'],
    queryFn: () => financeApi.stats(),
    staleTime: 60_000,
  });
}

// Invoices
export function useInvoices(params: ListInvoicesParams = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => financeApi.listInvoices(params),
    staleTime: 30_000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => financeApi.getInvoiceById(id),
    enabled: !!id,
  });
}

export function useMyInvoices() {
  return useQuery({
    queryKey: ['invoices', 'me'],
    queryFn: () => financeApi.getMyInvoices(),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => financeApi.createInvoice(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useCancelInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => financeApi.cancelInvoice(id),
    onSuccess: (updated: Invoice) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.setQueryData(['invoices', id], updated);
    },
  });
}

// Payments
export function usePayments(params: ListPaymentsParams = {}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => financeApi.listPayments(params),
    staleTime: 30_000,
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => financeApi.getPaymentById(id),
    enabled: !!id,
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ['payments', 'me'],
    queryFn: () => financeApi.getMyPayments(),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePaymentInput) => financeApi.createPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useVoidPayment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => financeApi.voidPayment(id, reason),
    onSuccess: (updated: Payment) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['finance'] });
      qc.setQueryData(['payments', id], updated);
    },
  });
}