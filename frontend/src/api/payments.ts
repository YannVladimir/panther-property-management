import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../types';

interface PaymentResponseDto {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomNumber: string;
  amount: number;
  date: string;
  dueDate?: string;
  type: string;
  method: string;
  reference?: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
}

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

function toFrontend(dto: PaymentResponseDto): Payment {
  return {
    id: String(dto.id),
    invoiceNumber: dto.invoiceNumber,
    clientId: String(dto.clientId),
    clientName: dto.clientName,
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: String(dto.roomId),
    roomNumber: dto.roomNumber,
    amount: dto.amount,
    date: dto.date,
    dueDate: dto.dueDate ?? '',
    type: dto.type.toLowerCase() as PaymentType,
    method: METHOD_TO_FRONTEND[dto.method] ?? 'Cash',
    reference: dto.reference ?? '',
    status: dto.status.toLowerCase() as PaymentStatus,
    receiptUrl: dto.receiptUrl,
    notes: dto.notes,
  };
}

export interface PaymentFilters {
  clientId?: string;
  propertyId?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  from?: string;
  to?: string;
  search?: string;
}

export function usePaymentsQuery(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const res = await api.get<PageResponse<PaymentResponseDto>>('/payments', {
        clientId: filters.clientId || undefined,
        propertyId: filters.propertyId || undefined,
        type: filters.type ? filters.type.toUpperCase() : undefined,
        status: filters.status ? filters.status.toUpperCase() : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        search: filters.search || undefined,
        size: 100,
      });
      return res.content.map(toFrontend);
    },
  });
}

/** Self-service — payments belonging to the currently-logged-in CLIENT-role user. */
export function useMyPaymentsQuery() {
  return useQuery({
    queryKey: ['payments', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<PaymentResponseDto>>('/payments/me', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export interface PaymentInput {
  clientId: string;
  propertyId: string;
  roomId: string;
  amount: number;
  date: string;
  dueDate?: string;
  type: PaymentType;
  method: PaymentMethod;
  reference?: string;
  status?: PaymentStatus;
  receiptUrl?: string;
  notes?: string;
}

export function useCreatePaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentInput) =>
      toFrontend(
        await api.post<PaymentResponseDto>('/payments', {
          clientId: Number(input.clientId),
          propertyId: Number(input.propertyId),
          roomId: Number(input.roomId),
          amount: input.amount,
          date: input.date,
          dueDate: input.dueDate,
          type: input.type.toUpperCase(),
          method: METHOD_TO_BACKEND[input.method],
          reference: input.reference,
          status: input.status ? input.status.toUpperCase() : undefined,
          receiptUrl: input.receiptUrl,
          notes: input.notes,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
