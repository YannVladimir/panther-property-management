import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { PageResponse } from './pagination';
import { PayrollRecord, PaymentMethod } from '../types';

interface PayrollRecordResponseDto {
  id: number;
  payrollNumber: string;
  employeeId: number;
  employeeName: string;
  position?: string;
  department?: string;
  period: string;
  basicSalary: number;
  allowances?: number;
  bonuses?: number;
  deductions?: number;
  taxAmount?: number;
  netSalary: number;
  paymentDate?: string;
  paymentStatus: string;
  paymentMethod: string;
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

const STATUS_TO_FRONTEND: Record<string, PayrollRecord['paymentStatus']> = {
  PAID: 'Paid',
  PROCESSING: 'Processing',
  PENDING: 'Pending',
};
const STATUS_TO_BACKEND: Record<PayrollRecord['paymentStatus'], string> = {
  Paid: 'PAID',
  Processing: 'PROCESSING',
  Pending: 'PENDING',
};

function toFrontend(dto: PayrollRecordResponseDto): PayrollRecord {
  return {
    id: String(dto.id),
    payrollNumber: dto.payrollNumber,
    employeeId: String(dto.employeeId),
    employeeName: dto.employeeName,
    position: dto.position ?? '',
    department: dto.department ?? '',
    period: dto.period,
    basicSalary: dto.basicSalary,
    allowances: dto.allowances ?? 0,
    bonuses: dto.bonuses ?? 0,
    deductions: dto.deductions ?? 0,
    taxAmount: dto.taxAmount ?? 0,
    netSalary: dto.netSalary,
    paymentDate: dto.paymentDate ?? '',
    paymentStatus: STATUS_TO_FRONTEND[dto.paymentStatus] ?? 'Pending',
    paymentMethod: METHOD_TO_FRONTEND[dto.paymentMethod] ?? 'Cash',
  };
}

export function usePayrollRecordsQuery() {
  return useQuery({
    queryKey: ['payrollRecords'],
    queryFn: async () => {
      const res = await api.get<PageResponse<PayrollRecordResponseDto>>('/payroll-records', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export function usePayrollRecordsByEmployeeQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['payrollRecords', 'employee', employeeId],
    queryFn: async () => {
      const res = await api.get<PageResponse<PayrollRecordResponseDto>>(`/payroll-records/employee/${employeeId}`, { size: 100 });
      return res.content.map(toFrontend);
    },
    enabled: !!employeeId,
  });
}

/** Self-service — payslips for the currently-logged-in HOUSEHOLD/OPERATIONS-role user. */
export function useMyPayrollRecordsQuery() {
  return useQuery({
    queryKey: ['payrollRecords', 'me'],
    queryFn: async () => {
      const res = await api.get<PageResponse<PayrollRecordResponseDto>>('/payroll-records/me', { size: 100 });
      return res.content.map(toFrontend);
    },
  });
}

export interface PayrollRecordInput {
  employeeId: string;
  employeeName: string;
  position?: string;
  department?: string;
  period: string;
  basicSalary: number;
  allowances?: number;
  bonuses?: number;
  deductions?: number;
  taxAmount?: number;
  paymentDate?: string;
  paymentStatus: PayrollRecord['paymentStatus'];
  paymentMethod: PaymentMethod;
}

export function useCreatePayrollRecordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PayrollRecordInput) =>
      toFrontend(
        await api.post<PayrollRecordResponseDto>('/payroll-records', {
          employeeId: Number(input.employeeId),
          employeeName: input.employeeName,
          position: input.position,
          department: input.department,
          period: input.period,
          basicSalary: input.basicSalary,
          allowances: input.allowances,
          bonuses: input.bonuses,
          deductions: input.deductions,
          taxAmount: input.taxAmount,
          paymentDate: input.paymentDate,
          paymentStatus: STATUS_TO_BACKEND[input.paymentStatus],
          paymentMethod: METHOD_TO_BACKEND[input.paymentMethod],
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payrollRecords'] }),
  });
}
