import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Expense, ExpenseCategory, PaymentMethod } from '../types';

interface ExpenseResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  paymentMethod: string;
  status: string;
  receiptAttached: boolean;
  notes?: string;
}

const CATEGORY_TO_FRONTEND: Record<string, ExpenseCategory> = {
  MAINTENANCE: 'Maintenance',
  CLEANING: 'Cleaning',
  SECURITY: 'Security',
  UTILITIES: 'Utilities',
  REPAIRS: 'Repairs',
  SUPPLIES: 'Supplies',
  STAFF: 'Staff',
  LANDSCAPING: 'Landscaping',
  OTHER: 'Other',
};
const CATEGORY_TO_BACKEND: Record<ExpenseCategory, string> = {
  Maintenance: 'MAINTENANCE',
  Cleaning: 'CLEANING',
  Security: 'SECURITY',
  Utilities: 'UTILITIES',
  Repairs: 'REPAIRS',
  Supplies: 'SUPPLIES',
  Staff: 'STAFF',
  Landscaping: 'LANDSCAPING',
  Other: 'OTHER',
};

const METHOD_TO_FRONTEND: Record<string, PaymentMethod> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
};
const METHOD_TO_BACKEND: Record<PaymentMethod, string> = {
  'Mobile Money': 'MOBILE_MONEY',
  'Bank Transfer': 'BANK_TRANSFER',
  'Credit Card': 'CREDIT_CARD',
  Cash: 'CASH',
};

function toFrontend(dto: ExpenseResponseDto): Expense {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    category: CATEGORY_TO_FRONTEND[dto.category] ?? 'Other',
    description: dto.description,
    amount: dto.amount,
    date: dto.date,
    vendor: dto.vendor ?? '',
    paymentMethod: METHOD_TO_FRONTEND[dto.paymentMethod] ?? 'Cash',
    status: dto.status.toLowerCase() as Expense['status'],
    receiptAttached: dto.receiptAttached,
    notes: dto.notes,
  };
}

export interface ExpenseFilters {
  propertyId?: string;
  category?: ExpenseCategory;
}

export function useExpensesQuery(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<ExpenseResponseDto>>('/expenses', {
        propertyId: filters.propertyId || undefined,
        category: filters.category ? CATEGORY_TO_BACKEND[filters.category] : undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

export interface ExpenseInput {
  propertyId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  paymentMethod: PaymentMethod;
  status?: Expense['status'];
  receiptAttached: boolean;
  notes?: string;
}

function toRequestBody(input: ExpenseInput) {
  return {
    propertyId: Number(input.propertyId),
    category: CATEGORY_TO_BACKEND[input.category],
    description: input.description,
    amount: input.amount,
    date: input.date,
    vendor: input.vendor,
    paymentMethod: METHOD_TO_BACKEND[input.paymentMethod],
    status: input.status ? input.status.toUpperCase() : undefined,
    receiptAttached: input.receiptAttached,
    notes: input.notes,
  };
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseInput) => toFrontend(await api.post<ExpenseResponseDto>('/expenses', toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ExpenseInput }) =>
      toFrontend(await api.put<ExpenseResponseDto>(`/expenses/${id}`, toRequestBody(input))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
}
