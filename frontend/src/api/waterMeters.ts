import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PaymentMethod, WaterMeterRecord } from '../types';

interface WaterMeterReadingDto {
  periodMonth: string;
  reading: number;
  consumption: number;
  amount: number;
}

interface WaterMeterResponseDto {
  id: number;
  propertyId: number;
  propertyName: string;
  roomId: number;
  roomNumber: string;
  clientId: number;
  clientName: string;
  meterNumber: string;
  previousReading: number;
  currentReading: number;
  consumptionM3: number;
  readingDate?: string;
  ratePerM3: number;
  totalAmount: number;
  paymentStatus: string;
  history: WaterMeterReadingDto[];
}

const METHOD_TO_BACKEND: Record<PaymentMethod, string> = {
  'Mobile Money': 'MOBILE_MONEY',
  'Bank Transfer': 'BANK_TRANSFER',
  'Credit Card': 'CREDIT_CARD',
  Cash: 'CASH',
};

function toFrontend(dto: WaterMeterResponseDto): WaterMeterRecord {
  return {
    id: String(dto.id),
    propertyId: String(dto.propertyId),
    propertyName: dto.propertyName,
    roomId: String(dto.roomId),
    roomNumber: dto.roomNumber,
    clientId: String(dto.clientId),
    clientName: dto.clientName,
    meterNumber: dto.meterNumber,
    previousReading: dto.previousReading,
    currentReading: dto.currentReading,
    consumptionM3: dto.consumptionM3,
    readingDate: dto.readingDate ?? '',
    ratePerM3: dto.ratePerM3,
    totalAmount: dto.totalAmount,
    paymentStatus: dto.paymentStatus.toLowerCase() as WaterMeterRecord['paymentStatus'],
    history: dto.history.map((h) => ({
      month: h.periodMonth,
      reading: h.reading,
      consumption: h.consumption,
      amount: h.amount,
    })),
  };
}

export function useWaterMetersQuery() {
  return useQuery({
    queryKey: ['waterMeters'],
    queryFn: async () => (await api.get<WaterMeterResponseDto[]>('/water-meters')).map(toFrontend),
  });
}

/** Self-service — "My water usage" for the currently-logged-in CLIENT-role user. */
export function useMyWaterMeterQuery() {
  return useQuery({
    queryKey: ['waterMeter', 'me'],
    queryFn: async () => toFrontend(await api.get<WaterMeterResponseDto>('/water-meters/me')),
  });
}

export function useWaterMeterQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['waterMeter', id],
    queryFn: async () => toFrontend(await api.get<WaterMeterResponseDto>(`/water-meters/${id}`)),
    enabled: !!id,
  });
}

export interface AssignWaterMeterInput {
  clientId: string;
  meterNumber: string;
  initialReading?: number;
  ratePerM3?: number;
}

export function useAssignWaterMeterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignWaterMeterInput) =>
      toFrontend(
        await api.post<WaterMeterResponseDto>('/water-meters', {
          clientId: Number(input.clientId),
          meterNumber: input.meterNumber,
          initialReading: input.initialReading,
          ratePerM3: input.ratePerM3,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waterMeters'] }),
  });
}

export function useUpdateWaterMeterReadingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentReading, newBillingCycle }: { id: string; currentReading: number; newBillingCycle?: boolean }) =>
      toFrontend(
        await api.patch<WaterMeterResponseDto>(`/water-meters/${id}/reading`, {
          currentReading,
          newBillingCycle: newBillingCycle ?? false,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waterMeters'] });
      queryClient.invalidateQueries({ queryKey: ['waterMeter', variables.id] });
    },
  });
}

export function useRecordWaterMeterPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentMethod, reference }: { id: string; paymentMethod: PaymentMethod; reference?: string }) =>
      toFrontend(
        await api.post<WaterMeterResponseDto>(`/water-meters/${id}/payment`, {
          paymentMethod: METHOD_TO_BACKEND[paymentMethod],
          reference,
        })
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waterMeters'] });
      queryClient.invalidateQueries({ queryKey: ['waterMeter', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
