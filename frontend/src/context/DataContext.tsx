import React, { createContext, useContext, useState } from 'react';
import {
  Property,
  Building,
  Room,
  RentalTypeConfig,
  Booking,
  Client,
  Payment,
  Expense,
  RecurringBill,
  Technician,
  PreventiveTask,
  DamageReport,
  WaterMeterRecord,
  Employee,
  PayrollRecord,
  Agent,
  MaintenanceIssue,
  ActivityLog,
  NotificationItem,
  BookingStatus,
  InspectionStatus,
  BillPayment,
  TechWorkOrder,
  TechDocument,
  PaymentMethod,
} from '../types';
import {
  mockProperties,
  mockBuildings,
  mockRooms,
  mockRentalTypes,
  mockBookings,
  mockClients,
  mockPayments,
  mockExpenses,
  mockRecurringBills,
  mockTechnicians,
  mockPreventiveTasks,
  mockDamages,
  mockWaterMeters,
  mockEmployees,
  mockPayrollRecords,
  mockAgents,
  mockMaintenanceIssues,
  mockActivityLogs,
  mockNotifications,
} from '../data/mockData';

interface DataContextType {
  properties: Property[];
  buildings: Building[];
  rooms: Room[];
  rentalTypes: RentalTypeConfig[];
  bookings: Booking[];
  clients: Client[];
  payments: Payment[];
  expenses: Expense[];
  recurringBills: RecurringBill[];
  technicians: Technician[];
  preventiveTasks: PreventiveTask[];
  damages: DamageReport[];
  waterMeters: WaterMeterRecord[];
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  agents: Agent[];
  maintenanceIssues: MaintenanceIssue[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];

  // Mutations
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'requestedDate' | 'timeline'>) => Booking;
  updateBookingStatus: (bookingId: string, status: BookingStatus, note?: string, user?: string) => void;
  assignRoomToBooking: (bookingId: string, roomId: string, user?: string) => void;
  
  addPayment: (payment: Omit<Payment, 'id' | 'invoiceNumber'>) => Payment;
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  addRecurringBill: (bill: Omit<RecurringBill, 'id'>) => RecurringBill;
  addBillPayment: (billId: string, payment: Omit<BillPayment, 'id'>) => void;
  markRecurringBillPaid: (billId: string) => void;
  
  updatePreventiveTaskStatus: (taskId: string, status: InspectionStatus, remarks: string, evidencePhotos?: string[]) => void;
  addPreventiveTask: (task: Omit<PreventiveTask, 'id'>) => void;
  
  addDamageReport: (damage: Omit<DamageReport, 'id'>) => DamageReport;
  updateDamageReport: (damage: DamageReport) => void;
  updateDamageStatus: (damageId: string, status: DamageReport['status'], resolutionNotes?: string) => void;
  
  updateWaterMeterReading: (meterId: string, currentReading: number, isNewBillingCycle?: boolean) => void;
  recordWaterMeterPayment: (meterId: string, paymentMethod?: PaymentMethod, reference?: string) => void;
  assignWaterMeter: (clientId: string, meterNumber: string, initialReading?: number) => void;
  
  addMaintenanceIssue: (issue: Omit<MaintenanceIssue, 'id' | 'ticketNumber' | 'reportedDate' | 'status'>) => MaintenanceIssue;
  updateMaintenanceIssueStatus: (issueId: string, status: MaintenanceIssue['status'], assignedTechId?: string, notes?: string) => void;
  
  addProperty: (property: Omit<Property, 'id' | 'code'>) => Property;
  updateProperty: (property: Property) => void;
  
  addRoom: (room: Omit<Room, 'id'>) => Room;
  updateRoom: (room: Room) => void;
  
  addRentalType: (rentalType: Omit<RentalTypeConfig, 'id'>) => RentalTypeConfig;
  updateRentalType: (rentalType: RentalTypeConfig) => void;

  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (client: Client) => void;
  updateClientStatus: (clientId: string, status: Client['status'], reason?: string) => void;
  addClientDocument: (clientId: string, doc: Omit<import('../types').ClientDocument, 'id' | 'uploadDate'>) => void;
  deleteClientDocument: (clientId: string, documentId: string) => void;
  addClientMaterial: (clientId: string, material: Omit<import('../types').ClientMaterial, 'id'>) => void;
  deleteClientMaterial: (clientId: string, materialId: string) => void;
  updateClientMaterialCondition: (clientId: string, materialId: string, condition: import('../types').ClientMaterial['condition']) => void;

  addAgent: (agent: Omit<import('../types').Agent, 'id' | 'deals' | 'totalCommissionEarned' | 'commissionPaid' | 'outstandingCommission' | 'clientsReferred' | 'bookingsCount' | 'successfulRentals'>) => import('../types').Agent;
  updateAgent: (agent: import('../types').Agent) => void;
  addAgentDeal: (agentId: string, deal: Omit<import('../types').AgentDeal, 'id' | 'date'>) => import('../types').AgentDeal;
  payAgentCommission: (agentId: string, amount: number, paymentMethod: string, reference: string, dealIds?: string[]) => void;

  addTechnician: (tech: Omit<import('../types').Technician, 'id' | 'totalJobs' | 'totalPaid' | 'workOrders' | 'documents'>) => import('../types').Technician;
  addTechWorkOrder: (techId: string, wo: Omit<TechWorkOrder, 'id' | 'jobNumber'>) => TechWorkOrder;
  updateTechWorkOrder: (techId: string, wo: TechWorkOrder) => void;
  addTechDocument: (techId: string, doc: Omit<TechDocument, 'id' | 'uploadDate'>) => TechDocument;

  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (emp: Employee) => void;
  updateEmployeeStatus: (empId: string, status: Employee['status'], reason?: string) => void;
  addEmployeeDocument: (empId: string, doc: Omit<import('../types').EmployeeDocument, 'id' | 'uploadDate'>) => void;
  deleteEmployeeDocument: (empId: string, documentId: string) => void;
  addEmployeeDailyTask: (empId: string, task: Omit<import('../types').EmployeeDailyTask, 'id' | 'assignedDate'>) => void;
  updateEmployeeDailyTask: (empId: string, taskId: string, updates: Partial<import('../types').EmployeeDailyTask>) => void;
  addEmployeeDamage: (empId: string, dmg: Omit<import('../types').EmployeeDamage, 'id'>) => void;
  addEmployeeLeave: (empId: string, leave: Omit<import('../types').EmployeeLeave, 'id' | 'requestedDate'>) => void;
  updateEmployeeLeave: (empId: string, leaveId: string, updates: Partial<import('../types').EmployeeLeave>) => void;
  addPayrollRecord: (payroll: Omit<PayrollRecord, 'id' | 'payrollNumber'>) => PayrollRecord;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [rentalTypes, setRentalTypes] = useState<RentalTypeConfig[]>(mockRentalTypes);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(mockRecurringBills);
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveTask[]>(mockPreventiveTasks);
  const [damages, setDamages] = useState<DamageReport[]>(mockDamages);
  const [waterMeters, setWaterMeters] = useState<WaterMeterRecord[]>(mockWaterMeters);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>(mockMaintenanceIssues);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'requestedDate' | 'timeline'>): Booking => {
    const id = `bk-${Date.now().toString().slice(-4)}`;
    const bookingNumber = `BK-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newBooking: Booking = {
      ...bookingData,
      id,
      bookingNumber,
      requestedDate: new Date().toISOString().split('T')[0],
      timeline: [
        {
          status: bookingData.status,
          timestamp: now,
          updatedBy: bookingData.clientName,
          note: 'Booking request submitted',
        },
      ],
    };

    setBookings((prev) => [newBooking, ...prev]);

    addActivityLog({
      userId: 'user-client',
      userName: bookingData.clientName,
      role: 'Client',
      action: 'New Booking Request',
      module: 'Bookings',
      details: `${bookingData.clientName} requested booking for ${bookingData.propertyName}`,
      type: 'info',
    });

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus, note?: string, user = 'Eric Manzi') => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status,
            timeline: [
              ...b.timeline,
              {
                status,
                timestamp: now,
                note: note || `Status updated to ${status.replace('_', ' ')}`,
                updatedBy: user,
              },
            ],
          };
        }
        return b;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: user,
      role: 'Operations',
      action: `Booking ${status.toUpperCase()}`,
      module: 'Bookings',
      details: `Updated booking ${bookingId} status to ${status}`,
      type: 'info',
    });
  };

  const assignRoomToBooking = (bookingId: string, roomId: string, user = 'Eric Manzi') => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
          return {
            ...b,
            roomId: room.id,
            roomNumber: room.roomNumber,
            status: 'room_assigned',
            timeline: [
              ...b.timeline,
              {
                status: 'room_assigned',
                timestamp: now,
                note: `Assigned room ${room.roomNumber} (${room.propertyName})`,
                updatedBy: user,
              },
            ],
          };
        }
        return b;
      })
    );

    // Update room status to reserved
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: 'reserved' } : r))
    );

    addActivityLog({
      userId: 'user-ops',
      userName: user,
      role: 'Operations',
      action: 'Room Assigned',
      module: 'Rooms',
      details: `Assigned room ${room.roomNumber} to booking ${bookingId}`,
      type: 'success',
    });
  };

  const addPayment = (paymentData: Omit<Payment, 'id' | 'invoiceNumber'>): Payment => {
    const id = `pay-${Date.now().toString().slice(-4)}`;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: Payment = {
      ...paymentData,
      id,
      invoiceNumber,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Update client status if rent payment is paid
    if (paymentData.status === 'paid' && paymentData.type === 'rent') {
      setClients((prev) =>
        prev.map((c) => (c.id === paymentData.clientId ? { ...c, paymentStatus: 'paid' } : c))
      );
    }

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Payment Recorded',
      module: 'Finance',
      details: `Recorded $${paymentData.amount} (${paymentData.type}) from ${paymentData.clientName}`,
      type: 'success',
    });

    return newPayment;
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now().toString().slice(-4)}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Expense Added',
      module: 'Expenses',
      details: `Logged $${expenseData.amount} for ${expenseData.category} (${expenseData.vendor})`,
      type: 'info',
    });

    return newExpense;
  };

  const addRecurringBill = (billData: Omit<RecurringBill, 'id'>): RecurringBill => {
    const newBill: RecurringBill = {
      ...billData,
      id: `bill-${Date.now().toString().slice(-4)}`,
    };
    setRecurringBills((prev) => [newBill, ...prev]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Recurring Bill Registered',
      module: 'Expenses',
      details: `Added ${billData.name} ($${billData.amount}/${billData.frequency}) for ${billData.propertyName}`,
      type: 'info',
    });

    return newBill;
  };

  const addBillPayment = (billId: string, paymentData: Omit<BillPayment, 'id'>) => {
    const newPayment: BillPayment = {
      ...paymentData,
      id: `bp-${Date.now().toString().slice(-6)}`,
    };
    setRecurringBills((prev) =>
      prev.map((b) =>
        b.id === billId
          ? { ...b, status: 'paid', payments: [newPayment, ...(b.payments || [])] }
          : b
      )
    );
  };

  const markRecurringBillPaid = (billId: string) => {
    setRecurringBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'paid' } : b))
    );
  };

  const updatePreventiveTaskStatus = (
    taskId: string,
    status: InspectionStatus,
    remarks: string,
    evidencePhotos: string[] = []
  ) => {
    const now = new Date().toISOString().split('T')[0];
    setPreventiveTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status,
            remarks: remarks || t.remarks,
            evidencePhotos: evidencePhotos.length > 0 ? evidencePhotos : t.evidencePhotos,
            lastCompletedDate: now,
          };
        }
        return t;
      })
    );

    addActivityLog({
      userId: 'user-household',
      userName: 'Emmanuel Habimana',
      role: 'Household / Staff',
      action: 'Preventive Task Inspected',
      module: 'Preventive Maintenance',
      details: `Marked task inspection as ${status.toUpperCase()} with remarks`,
      type: status === 'pass' ? 'success' : status === 'needs_attention' ? 'warning' : 'info',
    });
  };

  const addPreventiveTask = (taskData: Omit<PreventiveTask, 'id'>) => {
    const newTask: PreventiveTask = {
      ...taskData,
      id: `prev-${Date.now().toString().slice(-4)}`,
    };
    setPreventiveTasks((prev) => [newTask, ...prev]);
  };

  const addDamageReport = (damageData: Omit<DamageReport, 'id'>): DamageReport => {
    const newDamage: DamageReport = {
      ...damageData,
      id: `dmg-${Date.now().toString().slice(-4)}`,
    };
    setDamages((prev) => [newDamage, ...prev]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Damage Recorded',
      module: 'Damages',
      details: `Reported damage: ${damageData.item} in Room ${damageData.roomNumber} ($${damageData.estimatedCost})`,
      type: 'warning',
    });

    return newDamage;
  };

  const updateDamageReport = (damage: DamageReport) => {
    setDamages((prev) =>
      prev.map((d) => (d.id === damage.id ? damage : d))
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Damage Report Updated',
      module: 'Damages',
      details: `Updated damage record for ${damage.item} in Room ${damage.roomNumber}`,
      type: 'info',
    });
  };

  const updateDamageStatus = (damageId: string, status: DamageReport['status'], resolutionNotes?: string) => {
    setDamages((prev) =>
      prev.map((d) =>
        d.id === damageId ? { ...d, status, resolutionNotes: resolutionNotes || d.resolutionNotes } : d
      )
    );
  };

  const updateWaterMeterReading = (meterId: string, currentReading: number, isNewBillingCycle: boolean = false) => {
    setWaterMeters((prev) =>
      prev.map((m) => {
        if (m.id === meterId) {
          const prevReading = isNewBillingCycle ? m.currentReading : m.previousReading;
          const consumptionM3 = Math.max(0, parseFloat((currentReading - prevReading).toFixed(2)));
          const totalAmount = parseFloat((consumptionM3 * m.ratePerM3).toFixed(2));

          let newHistory = m.history || [];
          if (isNewBillingCycle && m.consumptionM3 > 0) {
            newHistory = [
              ...newHistory,
              {
                month: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
                reading: m.currentReading,
                consumption: m.consumptionM3,
                amount: m.totalAmount,
              },
            ];
          }

          return {
            ...m,
            previousReading: prevReading,
            currentReading,
            consumptionM3,
            totalAmount,
            readingDate: new Date().toISOString().split('T')[0],
            paymentStatus: totalAmount > 0 ? 'pending' : 'paid',
            history: newHistory,
          };
        }
        return m;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Water Reading Updated',
      module: 'Water Meters',
      details: `Updated meter reading for record ${meterId} to ${currentReading} m³`,
      type: 'info',
    });
  };

  const recordWaterMeterPayment = (
    meterId: string,
    paymentMethod: PaymentMethod = 'Mobile Money',
    reference: string = ''
  ) => {
    let meterInfo: WaterMeterRecord | undefined;

    setWaterMeters((prev) =>
      prev.map((m) => {
        if (m.id === meterId) {
          meterInfo = m;
          return {
            ...m,
            paymentStatus: 'paid',
          };
        }
        return m;
      })
    );

    if (meterInfo && meterInfo.totalAmount > 0) {
      addPayment({
        clientId: meterInfo.clientId,
        clientName: meterInfo.clientName,
        propertyId: meterInfo.propertyId,
        propertyName: meterInfo.propertyName,
        roomId: meterInfo.roomId,
        roomNumber: meterInfo.roomNumber,
        amount: meterInfo.totalAmount,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        type: 'utility',
        method: paymentMethod,
        reference: reference || `WTR-${Date.now().toString().slice(-6)}`,
        status: 'paid',
        notes: `Water utility bill settlement for meter ${meterInfo.meterNumber} (${meterInfo.consumptionM3} m³)`,
      });

      addActivityLog({
        userId: 'user-ops',
        userName: 'Eric Manzi',
        role: 'Operations',
        action: 'Water Utility Paid',
        module: 'Water Meters',
        details: `Recorded water bill payment of $${meterInfo.totalAmount} for ${meterInfo.clientName} (${meterInfo.roomNumber})`,
        type: 'success',
      });
    }
  };

  const assignWaterMeter = (clientId: string, meterNumber: string, initialReading: number = 0) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const newRecord: WaterMeterRecord = {
      id: `wm-${Date.now().toString().slice(-4)}`,
      propertyId: client.currentPropertyId || 'prop-01',
      propertyName: client.currentPropertyName || 'Kigali Heights',
      roomId: client.currentRoomId || 'room-01',
      roomNumber: client.currentRoomNumber || 'N/A',
      clientId: client.id,
      clientName: client.name,
      meterNumber,
      previousReading: initialReading,
      currentReading: initialReading,
      consumptionM3: 0,
      readingDate: new Date().toISOString().split('T')[0],
      ratePerM3: 1.75,
      totalAmount: 0,
      paymentStatus: 'paid',
      history: [
        { month: 'Jun 2026', reading: Math.max(0, initialReading - 20), consumption: 10.5, amount: 18.38 },
        { month: 'Jul 2026', reading: Math.max(0, initialReading - 10), consumption: 10.0, amount: 17.50 },
      ],
    };

    setWaterMeters((prev) => [...prev, newRecord]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Water Meter Assigned',
      module: 'Water Meters',
      details: `Assigned meter ${meterNumber} to ${client.name}`,
      type: 'info',
    });
  };

  const addMaintenanceIssue = (
    issueData: Omit<MaintenanceIssue, 'id' | 'ticketNumber' | 'reportedDate' | 'status'>
  ): MaintenanceIssue => {
    const id = `issue-${Date.now().toString().slice(-4)}`;
    const ticketNumber = `TKT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newIssue: MaintenanceIssue = {
      ...issueData,
      id,
      ticketNumber,
      reportedDate: now,
      status: 'Submitted',
    };

    setMaintenanceIssues((prev) => [newIssue, ...prev]);

    addActivityLog({
      userId: 'user-client',
      userName: issueData.clientName,
      role: 'Client',
      action: 'Issue Reported',
      module: 'Maintenance',
      details: `${issueData.title} reported for Room ${issueData.roomNumber}`,
      type: 'warning',
    });

    return newIssue;
  };

  const updateMaintenanceIssueStatus = (
    issueId: string,
    status: MaintenanceIssue['status'],
    assignedTechId?: string,
    notes?: string
  ) => {
    let techName: string | undefined;
    let techSpecialty: string | undefined;

    if (assignedTechId) {
      const tech = technicians.find((t) => t.id === assignedTechId);
      if (tech) {
        techName = tech.name;
        techSpecialty = tech.specialization;
      }
    }

    setMaintenanceIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          return {
            ...issue,
            status,
            assignedTechnicianId: assignedTechId || issue.assignedTechnicianId,
            assignedTechnicianName: techName || issue.assignedTechnicianName,
            technicianSpecialty: techSpecialty || issue.technicianSpecialty,
            resolutionNotes: notes || issue.resolutionNotes,
            resolutionDate: status === 'Resolved' ? new Date().toISOString().replace('T', ' ').substring(0, 16) : issue.resolutionDate,
          };
        }
        return issue;
      })
    );
  };

  const addProperty = (propertyData: Omit<Property, 'id' | 'code'>): Property => {
    const code = propertyData.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const newProperty: Property = {
      ...propertyData,
      id: `prop-${Date.now().toString().slice(-4)}`,
      code,
    };
    setProperties((prev) => [...prev, newProperty]);
    return newProperty;
  };

  const updateProperty = (property: Property) => {
    setProperties((prev) => prev.map((p) => (p.id === property.id ? property : p)));
  };

  const addRoom = (roomData: Omit<Room, 'id'>): Room => {
    const newRoom: Room = {
      ...roomData,
      id: `room-${Date.now().toString().slice(-4)}`,
    };
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  };

  const updateRoom = (room: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
  };

  const addRentalType = (rentalTypeData: Omit<RentalTypeConfig, 'id'>): RentalTypeConfig => {
    const newRT: RentalTypeConfig = {
      ...rentalTypeData,
      id: `rt-${Date.now().toString().slice(-4)}`,
    };
    setRentalTypes((prev) => [...prev, newRT]);
    return newRT;
  };

  const updateRentalType = (rentalType: RentalTypeConfig) => {
    setRentalTypes((prev) => prev.map((rt) => (rt.id === rentalType.id ? rentalType : rt)));
  };

  const addClient = (clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now().toString().slice(-4)}`,
      materials: clientData.materials || [],
      documents: clientData.documents || [],
    };
    setClients((prev) => [newClient, ...prev]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Resident Registered',
      module: 'Clients',
      details: `Created new resident account for ${clientData.name}`,
      type: 'success',
    });

    return newClient;
  };

  const updateClient = (client: Client) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Client Updated',
      module: 'Clients',
      details: `Updated profile details for resident ${client.name}`,
      type: 'info',
    });
  };

  const updateClientStatus = (
    clientId: string,
    status: Client['status'],
    reason?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    let clientName = '';

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          clientName = c.name;
          return {
            ...c,
            status,
            deactivationReason: status === 'active' ? undefined : reason || c.deactivationReason,
            deactivatedDate: status === 'active' ? undefined : today,
          };
        }
        return c;
      })
    );

    const actionText =
      status === 'active'
        ? 'Resident Profile Reactivated'
        : status === 'suspended'
        ? 'Resident Suspended'
        : status === 'former'
        ? 'Resident Marked as Former'
        : 'Resident Profile Deactivated';

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: actionText,
      module: 'Clients',
      details: `${actionText}: ${clientName || clientId}${reason ? ` (Reason: ${reason})` : ''}`,
      type: status === 'active' ? 'success' : 'warning',
    });
  };

  const addClientDocument = (
    clientId: string,
    docData: Omit<import('../types').ClientDocument, 'id' | 'uploadDate'>
  ) => {
    const newDoc: import('../types').ClientDocument = {
      ...docData,
      id: `doc-${Date.now().toString().slice(-4)}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const docs = c.documents || [];
          return {
            ...c,
            documents: [newDoc, ...docs],
          };
        }
        return c;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Document Uploaded',
      module: 'Clients',
      details: `Uploaded ${docData.type}: ${docData.name} for resident`,
      type: 'success',
    });
  };

  const deleteClientDocument = (clientId: string, documentId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            documents: (c.documents || []).filter((d) => d.id !== documentId),
          };
        }
        return c;
      })
    );
  };

  const addClientMaterial = (
    clientId: string,
    materialData: Omit<import('../types').ClientMaterial, 'id'>
  ) => {
    const newMat: import('../types').ClientMaterial = {
      ...materialData,
      id: `cm-${Date.now().toString().slice(-4)}`,
    };

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            materials: [newMat, ...c.materials],
          };
        }
        return c;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Inventory Assigned',
      module: 'Materials',
      details: `Assigned inventory item ${materialData.name} (${materialData.serialNumber}) to resident`,
      type: 'info',
    });
  };

  const deleteClientMaterial = (clientId: string, materialId: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            materials: c.materials.filter((m) => m.id !== materialId),
          };
        }
        return c;
      })
    );
  };

  const updateClientMaterialCondition = (
    clientId: string,
    materialId: string,
    condition: import('../types').ClientMaterial['condition']
  ) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            materials: c.materials.map((m) =>
              m.id === materialId ? { ...m, condition } : m
            ),
          };
        }
        return c;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Asset Condition Updated',
      module: 'Materials',
      details: `Updated asset condition to "${condition}" for resident`,
      type: 'info',
    });
  };

  const addAgent = (
    agentData: Omit<
      import('../types').Agent,
      | 'id'
      | 'deals'
      | 'totalCommissionEarned'
      | 'commissionPaid'
      | 'outstandingCommission'
      | 'clientsReferred'
      | 'bookingsCount'
      | 'successfulRentals'
    >
  ): import('../types').Agent => {
    const newAgent: import('../types').Agent = {
      ...agentData,
      id: `agt-${Date.now().toString().slice(-4)}`,
      clientsReferred: 0,
      bookingsCount: 0,
      successfulRentals: 0,
      totalCommissionEarned: 0,
      commissionPaid: 0,
      outstandingCommission: 0,
      deals: [],
    };

    setAgents((prev) => [newAgent, ...prev]);

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Broker Registered',
      module: 'Agents',
      details: `Registered partner broker ${agentData.name} (${agentData.agency || 'Independent'})`,
      type: 'success',
    });

    return newAgent;
  };

  const updateAgent = (agent: import('../types').Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Broker Profile Updated',
      module: 'Agents',
      details: `Updated details for broker ${agent.name}`,
      type: 'info',
    });
  };

  const addAgentDeal = (
    agentId: string,
    dealData: Omit<import('../types').AgentDeal, 'id' | 'date'>
  ): import('../types').AgentDeal => {
    const newDeal: import('../types').AgentDeal = {
      ...dealData,
      id: `deal-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
    };

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const isPaid = newDeal.status === 'Paid';
          const newTotal = a.totalCommissionEarned + newDeal.commissionAmount;
          const newPaid = isPaid ? a.commissionPaid + newDeal.commissionAmount : a.commissionPaid;
          const newOutstanding = isPaid ? a.outstandingCommission : a.outstandingCommission + newDeal.commissionAmount;

          return {
            ...a,
            successfulRentals: a.successfulRentals + 1,
            clientsReferred: a.clientsReferred + 1,
            totalCommissionEarned: newTotal,
            commissionPaid: newPaid,
            outstandingCommission: newOutstanding,
            deals: [newDeal, ...(a.deals || [])],
          };
        }
        return a;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Agent Commission Logged',
      module: 'Agents',
      details: `Recorded $${dealData.commissionAmount} commission deal for tenant ${dealData.clientName}`,
      type: 'success',
    });

    return newDeal;
  };

  const payAgentCommission = (
    agentId: string,
    amount: number,
    paymentMethod: string,
    reference: string,
    dealIds: string[] = []
  ) => {
    const now = new Date().toISOString().split('T')[0];

    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId) {
          const updatedDeals = (a.deals || []).map((d) => {
            if (dealIds.length === 0 || dealIds.includes(d.id)) {
              return {
                ...d,
                status: 'Paid' as const,
                payoutDate: now,
                payoutReference: reference,
              };
            }
            return d;
          });

          return {
            ...a,
            commissionPaid: a.commissionPaid + amount,
            outstandingCommission: Math.max(0, a.outstandingCommission - amount),
            deals: updatedDeals,
          };
        }
        return a;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Commission Disbursed',
      module: 'Agents',
      details: `Disbursed $${amount} commission payout via ${paymentMethod} (Ref: ${reference})`,
      type: 'success',
    });
  };

  const addTechnician = (techData: Omit<import('../types').Technician, 'id' | 'totalJobs' | 'totalPaid' | 'workOrders' | 'documents'>): import('../types').Technician => {
    const newTech: import('../types').Technician = {
      ...techData,
      id: `tech-${Date.now().toString().slice(-5)}`,
      totalJobs: 0,
      totalPaid: 0,
      workOrders: [],
      documents: [],
    };
    setTechnicians((prev) => [newTech, ...prev]);
    addActivityLog({ userId: 'user-ops', userName: 'Eric Manzi', role: 'Operations', action: 'Technician Registered', module: 'Technicians', details: `Added ${techData.name} (${techData.specialization}) — ${techData.company}`, type: 'info' });
    return newTech;
  };

  const addTechWorkOrder = (techId: string, woData: Omit<TechWorkOrder, 'id' | 'jobNumber'>): TechWorkOrder => {
    const newWO: TechWorkOrder = {
      ...woData,
      id: `wo-${Date.now().toString().slice(-6)}`,
      jobNumber: `WO-${Date.now().toString().slice(-5)}`,
    };
    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === techId
          ? { ...t, totalJobs: t.totalJobs + 1, workOrders: [newWO, ...(t.workOrders || [])] }
          : t
      )
    );
    addActivityLog({ userId: 'user-ops', userName: 'Eric Manzi', role: 'Operations', action: 'Work Order Dispatched', module: 'Technicians', details: `Dispatched ${newWO.title} (${newWO.jobNumber}) to technician`, type: 'info' });
    return newWO;
  };

  const updateTechWorkOrder = (techId: string, wo: TechWorkOrder): void => {
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id !== techId) return t;
        const updatedOrders = (t.workOrders || []).map((w) => (w.id === wo.id ? wo : w));
        const newTotalPaid = updatedOrders.reduce((s, w) => s + (w.paidAmount || 0), 0);
        return { ...t, totalPaid: newTotalPaid, workOrders: updatedOrders };
      })
    );
  };

  const addTechDocument = (techId: string, docData: Omit<TechDocument, 'id' | 'uploadDate'>): TechDocument => {
    const newDoc: TechDocument = {
      ...docData,
      id: `td-${Date.now().toString().slice(-6)}`,
      uploadDate: new Date().toISOString().slice(0, 10),
    };
    setTechnicians((prev) =>
      prev.map((t) =>
        t.id === techId
          ? { ...t, documents: [newDoc, ...(t.documents || [])] }
          : t
      )
    );
    return newDoc;
  };

  const addEmployee = (empData: Omit<Employee, 'id'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now().toString().slice(-4)}`,
      documents: empData.documents || [],
      dailyTasks: empData.dailyTasks || [],
      damages: empData.damages || [],
      status: empData.status || 'active',
    };
    setEmployees((prev) => [newEmp, ...prev]);
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Employee Added',
      module: 'HR & Payroll',
      details: `Registered new staff member ${newEmp.name} (${newEmp.position})`,
      type: 'info',
    });
    return newEmp;
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Employee Updated',
      module: 'HR & Payroll',
      details: `Updated dossier for ${emp.name}`,
      type: 'info',
    });
  };

  const updateEmployeeStatus = (empId: string, status: Employee['status'], reason?: string) => {
    let empName = '';
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === empId) {
          empName = e.name;
          return { ...e, status, statusReason: reason || e.statusReason };
        }
        return e;
      })
    );
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Employee Status Changed',
      module: 'HR & Payroll',
      details: `Changed ${empName}'s status to ${status.toUpperCase()}${reason ? ` (${reason})` : ''}`,
      type: status === 'active' ? 'success' : 'warning',
    });
  };

  const addEmployeeDocument = (empId: string, docData: Omit<import('../types').EmployeeDocument, 'id' | 'uploadDate'>) => {
    const newDoc: import('../types').EmployeeDocument = {
      ...docData,
      id: `edoc-${Date.now().toString().slice(-4)}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, documents: [newDoc, ...(e.documents || [])] } : e))
    );
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Employee Document Uploaded',
      module: 'HR & Payroll',
      details: `Uploaded ${docData.type}: ${docData.name}`,
      type: 'info',
    });
  };

  const deleteEmployeeDocument = (empId: string, documentId: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId
          ? { ...e, documents: (e.documents || []).filter((d) => d.id !== documentId) }
          : e
      )
    );
  };

  const addEmployeeDailyTask = (empId: string, taskData: Omit<import('../types').EmployeeDailyTask, 'id' | 'assignedDate'>) => {
    const newTask: import('../types').EmployeeDailyTask = {
      ...taskData,
      id: `task-${Date.now().toString().slice(-4)}`,
      assignedDate: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, dailyTasks: [newTask, ...(e.dailyTasks || [])] } : e))
    );
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Daily Task Assigned',
      module: 'HR & Tasks',
      details: `Assigned task "${taskData.title}" to staff`,
      type: 'info',
    });
  };

  const updateEmployeeDailyTask = (empId: string, taskId: string, updates: Partial<import('../types').EmployeeDailyTask>) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== empId) return e;
        const updatedTasks = (e.dailyTasks || []).map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...updates,
                completedDate: updates.status === 'Completed' ? new Date().toISOString().split('T')[0] : t.completedDate,
              }
            : t
        );
        return { ...e, dailyTasks: updatedTasks };
      })
    );
  };

  const addEmployeeDamage = (empId: string, dmgData: Omit<import('../types').EmployeeDamage, 'id'>) => {
    const newDamage: import('../types').EmployeeDamage = {
      ...dmgData,
      id: `edmg-${Date.now().toString().slice(-4)}`,
    };
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, damages: [newDamage, ...(e.damages || [])] } : e))
    );
    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Staff Damage Recorded',
      module: 'HR Incidents',
      details: `Logged damage incident for ${dmgData.item} ($${dmgData.estimatedCost})`,
      type: 'warning',
    });
  };

  const addPayrollRecord = (payrollData: Omit<PayrollRecord, 'id' | 'payrollNumber'>): PayrollRecord => {
    const newPayroll: PayrollRecord = {
      ...payrollData,
      id: `payr-${Date.now().toString().slice(-4)}`,
      payrollNumber: `PAY-${new Date().toISOString().slice(0, 7)}-${Math.floor(100 + Math.random() * 900)}`,
    };
    setPayrollRecords((prev) => [newPayroll, ...prev]);
    addActivityLog({
      userId: 'user-ops',
      userName: 'Diane Umutoni',
      role: 'Finance',
      action: 'Payroll Generated',
      module: 'HR & Payroll',
      details: `Generated payroll slip ${newPayroll.payrollNumber} for ${newPayroll.employeeName} ($${newPayroll.netSalary})`,
      type: 'success',
    });
    return newPayroll;
  };

  const addEmployeeLeave = (empId: string, leaveData: Omit<import('../types').EmployeeLeave, 'id' | 'requestedDate'>) => {
    const newLeave: import('../types').EmployeeLeave = {
      ...leaveData,
      id: `leave-${Date.now().toString().slice(-4)}`,
      requestedDate: new Date().toISOString().split('T')[0],
    };

    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id === empId) {
          const updatedStatus = leaveData.status === 'Approved' ? 'on_leave' : e.status;
          const updatedReason = leaveData.status === 'Approved' ? `${leaveData.leaveType} (${leaveData.startDate} to ${leaveData.endDate})` : e.statusReason;
          return {
            ...e,
            status: updatedStatus,
            statusReason: updatedReason,
            leaves: [newLeave, ...(e.leaves || [])],
          };
        }
        return e;
      })
    );

    addActivityLog({
      userId: 'user-ops',
      userName: 'Eric Manzi',
      role: 'Operations',
      action: 'Staff Leave Recorded',
      module: 'HR Leaves',
      details: `Recorded ${leaveData.leaveType} (${leaveData.daysCount} days) for staff member`,
      type: 'info',
    });
  };

  const updateEmployeeLeave = (empId: string, leaveId: string, updates: Partial<import('../types').EmployeeLeave>) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== empId) return e;
        const updatedLeaves = (e.leaves || []).map((l) => (l.id === leaveId ? { ...l, ...updates } : l));
        const hasActiveApprovedLeave = updatedLeaves.some(
          (l) => l.status === 'Approved'
        );
        return {
          ...e,
          status: hasActiveApprovedLeave ? 'on_leave' : 'active',
          leaves: updatedLeaves,
        };
      })
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider
      value={{
        properties,
        buildings,
        rooms,
        rentalTypes,
        bookings,
        clients,
        payments,
        expenses,
        recurringBills,
        technicians,
        preventiveTasks,
        damages,
        waterMeters,
        employees,
        payrollRecords,
        agents,
        maintenanceIssues,
        activityLogs,
        notifications,

        addBooking,
        updateBookingStatus,
        assignRoomToBooking,
        addPayment,
        addExpense,
        addRecurringBill,
        addBillPayment,
        markRecurringBillPaid,
        updatePreventiveTaskStatus,
        addPreventiveTask,
        addDamageReport,
        updateDamageReport,
        updateDamageStatus,
        updateWaterMeterReading,
        recordWaterMeterPayment,
        assignWaterMeter,
        addMaintenanceIssue,
        updateMaintenanceIssueStatus,
        addProperty,
        updateProperty,
        addRoom,
        updateRoom,
        addRentalType,
        updateRentalType,
        addClient,
        updateClient,
        updateClientStatus,
        addClientDocument,
        deleteClientDocument,
        addClientMaterial,
        deleteClientMaterial,
        updateClientMaterialCondition,
        addAgent,
        updateAgent,
        addAgentDeal,
        payAgentCommission,
        addTechnician,
        addTechWorkOrder,
        updateTechWorkOrder,
        addTechDocument,
        addEmployee,
        updateEmployee,
        updateEmployeeStatus,
        addEmployeeDocument,
        deleteEmployeeDocument,
        addEmployeeDailyTask,
        updateEmployeeDailyTask,
        addEmployeeDamage,
        addEmployeeLeave,
        updateEmployeeLeave,
        addPayrollRecord,
        markNotificationRead,
        markAllNotificationsRead,
        addActivityLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
