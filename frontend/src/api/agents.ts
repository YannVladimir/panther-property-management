import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { Agent, AgentDeal } from '../types';

interface AgentDealDto {
  id: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyId: number;
  propertyName: string;
  roomId?: number;
  roomNumber?: string;
  rentalType?: string;
  monthlyRent: number;
  commissionPercentage: number;
  commissionAmount: number;
  dealDate: string;
  status: string;
  payoutDate?: string;
  payoutReference?: string;
  notes?: string;
}

interface AgentResponseDto {
  id: number;
  name: string;
  agency?: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  status: string;
  clientsReferred: number;
  bookingsCount: number;
  successfulRentals: number;
  commissionRatePercent: number;
  totalCommissionEarned: number;
  commissionPaid: number;
  outstandingCommission: number;
  paymentMethod?: string;
  payoutAccount?: string;
  notes?: string;
  deals: AgentDealDto[];
}

const DEAL_STATUS_TO_FRONTEND: Record<string, AgentDeal['status']> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
};
const PAYOUT_METHOD_TO_FRONTEND: Record<string, NonNullable<Agent['paymentMethod']>> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Bank Transfer',
  CASH: 'Cash',
};
const PAYOUT_METHOD_TO_BACKEND: Record<NonNullable<Agent['paymentMethod']>, string> = {
  'Mobile Money': 'MOBILE_MONEY',
  'Bank Transfer': 'BANK_TRANSFER',
  Cash: 'CASH',
};

function toFrontendDeal(dto: AgentDealDto): AgentDeal {
  return {
    id: String(dto.id),
    clientName: dto.clientName,
    clientEmail: dto.clientEmail,
    clientPhone: dto.clientPhone,
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: dto.roomId !== undefined ? String(dto.roomId) : undefined,
    roomNumber: dto.roomNumber,
    rentalType: dto.rentalType,
    monthlyRent: dto.monthlyRent,
    commissionPercentage: dto.commissionPercentage,
    commissionAmount: dto.commissionAmount,
    date: dto.dealDate,
    status: DEAL_STATUS_TO_FRONTEND[dto.status] ?? 'Pending',
    payoutDate: dto.payoutDate,
    payoutReference: dto.payoutReference,
    notes: dto.notes,
  };
}

function toFrontend(dto: AgentResponseDto): Agent {
  return {
    id: String(dto.id),
    name: dto.name,
    agency: dto.agency,
    phone: dto.phone,
    email: dto.email,
    avatar: dto.avatarUrl ?? '',
    status: dto.status === 'ACTIVE' ? 'Active' : 'Inactive',
    clientsReferred: dto.clientsReferred,
    bookingsCount: dto.bookingsCount,
    successfulRentals: dto.successfulRentals,
    commissionRatePercent: dto.commissionRatePercent,
    totalCommissionEarned: dto.totalCommissionEarned,
    commissionPaid: dto.commissionPaid,
    outstandingCommission: dto.outstandingCommission,
    paymentMethod: dto.paymentMethod ? PAYOUT_METHOD_TO_FRONTEND[dto.paymentMethod] : undefined,
    payoutAccount: dto.payoutAccount,
    notes: dto.notes,
    deals: dto.deals.map(toFrontendDeal),
  };
}

export function useAgentsQuery() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get<PageResponse<AgentResponseDto>>('/agents', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export function useAgentQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: async () => toFrontend(await api.get<AgentResponseDto>(`/agents/${id}`)),
    enabled: !!id,
  });
}

export interface AgentInput {
  name: string;
  agency?: string;
  phone: string;
  email: string;
  commissionRatePercent: number;
  status?: Agent['status'];
  paymentMethod?: Agent['paymentMethod'];
  payoutAccount?: string;
  notes?: string;
}

export function useCreateAgentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AgentInput) =>
      toFrontend(
        await api.post<AgentResponseDto>('/agents', {
          name: input.name,
          agency: input.agency,
          phone: input.phone,
          email: input.email,
          commissionRatePercent: input.commissionRatePercent,
          paymentMethod: input.paymentMethod ? PAYOUT_METHOD_TO_BACKEND[input.paymentMethod] : undefined,
          payoutAccount: input.payoutAccount,
          notes: input.notes,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });
}

export function useUpdateAgentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AgentInput }) =>
      toFrontend(
        await api.put<AgentResponseDto>(`/agents/${id}`, {
          name: input.name,
          agency: input.agency,
          phone: input.phone,
          email: input.email,
          commissionRatePercent: input.commissionRatePercent,
          status: (input.status ?? 'Active').toUpperCase(),
          paymentMethod: input.paymentMethod ? PAYOUT_METHOD_TO_BACKEND[input.paymentMethod] : undefined,
          payoutAccount: input.payoutAccount,
          notes: input.notes,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', variables.id] });
    },
  });
}

export interface AgentDealInput {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyId: string;
  roomId?: string;
  rentalType?: string;
  monthlyRent: number;
  commissionPercentage?: number;
  notes?: string;
}

export function useAddAgentDealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, input }: { agentId: string; input: AgentDealInput }) =>
      toFrontendDeal(
        await api.post<AgentDealDto>(`/agents/${agentId}/deals`, {
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone,
          propertyId: Number(input.propertyId),
          roomId: input.roomId ? Number(input.roomId) : undefined,
          rentalType: input.rentalType,
          monthlyRent: input.monthlyRent,
          commissionPercentage: input.commissionPercentage,
          notes: input.notes,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', variables.agentId] });
    },
  });
}

export function usePayAgentCommissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      amount,
      paymentMethod,
      reference,
      dealIds,
    }: {
      agentId: string;
      amount: number;
      paymentMethod: string;
      reference: string;
      dealIds?: string[];
    }) =>
      api.post(`/agents/${agentId}/pay-commission`, {
        amount,
        paymentMethod,
        reference,
        dealIds: dealIds?.map(Number),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', variables.agentId] });
    },
  });
}
