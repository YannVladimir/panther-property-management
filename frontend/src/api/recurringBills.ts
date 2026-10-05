import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { BillPayment, RecurringBill } from '../types';

interface BillPaymentResponseDto {
  id: number;
  paidDate: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

interface RecurringBillResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  name: string;
  category: string;
  vendor?: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
  status: string;
  autoRenew: boolean;
  reminderDays: number;
  payments: BillPaymentResponseDto[];
}

const CATEGORY_TO_FRONTEND: Record<string, RecurringBill['category']> = {
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  INTERNET: 'Internet',
  SECURITY: 'Security',
  CLEANING: 'Cleaning',
  MAINTENANCE_CONTRACT: 'Maintenance Contract',
  GARBAGE_COLLECTION: 'Garbage Collection',
};
const CATEGORY_TO_BACKEND: Record<RecurringBill['category'], string> = {
  Electricity: 'ELECTRICITY',
  Water: 'WATER',
  Internet: 'INTERNET',
  Security: 'SECURITY',
  Cleaning: 'CLEANING',
  'Maintenance Contract': 'MAINTENANCE_CONTRACT',
  'Garbage Collection': 'GARBAGE_COLLECTION',
};

const FREQUENCY_TO_FRONTEND: Record<string, RecurringBill['frequency']> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  BI_WEEKLY: 'Bi-Weekly',
  ANNUAL: 'Annual',
};
const FREQUENCY_TO_BACKEND: Record<RecurringBill['frequency'], string> = {
  Monthly: 'MONTHLY',
  Quarterly: 'QUARTERLY',
  'Bi-Weekly': 'BI_WEEKLY',
  Annual: 'ANNUAL',
};

const BILL_METHOD_TO_FRONTEND: Record<string, BillPayment['method']> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
};
const BILL_METHOD_TO_BACKEND: Record<BillPayment['method'], string> = {
  'Mobile Money': 'MOBILE_MONEY',
  'Bank Transfer': 'BANK_TRANSFER',
  Cash: 'CASH',
  Cheque: 'CHEQUE',
};

function toFrontendBillPayment(dto: BillPaymentResponseDto): BillPayment {
  return {
    id: String(dto.id),
    paidDate: dto.paidDate,
    amount: dto.amount,
    method: BILL_METHOD_TO_FRONTEND[dto.method] ?? 'Cash',
    reference: dto.reference ?? '',
    notes: dto.notes,
    proofUrl: dto.proofUrl,
  };
}

function toFrontend(dto: RecurringBillResponseDto): RecurringBill {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    name: dto.name,
    category: CATEGORY_TO_FRONTEND[dto.category] ?? 'Electricity',
    vendor: dto.vendor ?? '',
    amount: dto.amount,
    frequency: FREQUENCY_TO_FRONTEND[dto.frequency] ?? 'Monthly',
    nextDueDate: dto.nextDueDate,
    status: dto.status.toLowerCase() as RecurringBill['status'],
    autoRenew: dto.autoRenew,
    reminderDays: dto.reminderDays,
    payments: dto.payments.map(toFrontendBillPayment),
  };
}

export interface RecurringBillFilters {
  propertyId?: string;
  status?: RecurringBill['status'];
}

export function useRecurringBillsQuery(filters: RecurringBillFilters = {}) {
  return useQuery({
    queryKey: ['recurringBills', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<RecurringBillResponseDto>>('/recurring-bills', {
        propertyId: filters.propertyId || undefined,
        status: filters.status ? filters.status.toUpperCase() : undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export interface RecurringBillInput {
  propertyId: string;
  name: string;
  category: RecurringBill['category'];
  vendor?: string;
  amount: number;
  frequency: RecurringBill['frequency'];
  nextDueDate: string;
  status?: RecurringBill['status'];
  autoRenew: boolean;
  reminderDays: number;
}

function toRequestBody(input: RecurringBillInput) {
  return {
    propertyId: Number(input.propertyId),
    name: input.name,
    category: CATEGORY_TO_BACKEND[input.category],
    vendor: input.vendor,
    amount: input.amount,
    frequency: FREQUENCY_TO_BACKEND[input.frequency],
    nextDueDate: input.nextDueDate,
    status: input.status ? input.status.toUpperCase() : undefined,
    autoRenew: input.autoRenew,
    reminderDays: input.reminderDays,
  };
}

export function useCreateRecurringBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecurringBillInput) =>
      toFrontend(await api.post<RecurringBillResponseDto>('/recurring-bills', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringBills'] }),
  });
}

export function useUpdateRecurringBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecurringBillInput }) =>
      toFrontend(await api.put<RecurringBillResponseDto>(`/recurring-bills/${id}`, toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringBills'] }),
  });
}

export function useDeleteRecurringBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/recurring-bills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringBills'] }),
  });
}

export interface BillPaymentInput {
  paidDate: string;
  amount: number;
  method: BillPayment['method'];
  reference?: string;
  notes?: string;
  proofUrl?: string;
}

export function useAddBillPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ billId, input }: { billId: string; input: BillPaymentInput }) =>
      toFrontendBillPayment(
        await api.post<BillPaymentResponseDto>(`/recurring-bills/${billId}/payments`, {
          paidDate: input.paidDate,
          amount: input.amount,
          method: BILL_METHOD_TO_BACKEND[input.method],
          reference: input.reference,
          notes: input.notes,
          proofUrl: input.proofUrl,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringBills'] }),
  });
}

export function useMarkRecurringBillPaidMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (billId: string) => toFrontend(await api.patch<RecurringBillResponseDto>(`/recurring-bills/${billId}/mark-paid`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringBills'] }),
  });
}
