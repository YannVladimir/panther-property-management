import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { PropertiesPage } from '../pages/public/PropertiesPage';
import { PropertyDetailPage } from '../pages/public/PropertyDetailPage';
import { RoomDetailPage } from '../pages/public/RoomDetailPage';
import { LoginPage } from '../pages/public/LoginPage';

// Client Portal
import { ClientDashboard } from '../pages/client/ClientDashboard';
import { MyBookingPage } from '../pages/client/MyBookingPage';
import { MyRoomPage } from '../pages/client/MyRoomPage';
import { ClientPaymentsPage } from '../pages/client/ClientPaymentsPage';
import { MyMaterialsPage } from '../pages/client/MyMaterialsPage';
import { ReportIssuePage } from '../pages/client/ReportIssuePage';
import { ClientNotificationsPage } from '../pages/client/ClientNotificationsPage';

// Operations Manager
import { OperationsDashboard } from '../pages/operations/OperationsDashboard';
import { BookingsManagementPage } from '../pages/operations/BookingsManagementPage';
import { ClientsManagementPage } from '../pages/operations/ClientsManagementPage';
import { ClientDetailPage } from '../pages/operations/ClientDetailPage';
import { PropertiesManagementPage } from '../pages/operations/PropertiesManagementPage';
import { PaymentsManagementPage } from '../pages/operations/PaymentsManagementPage';
import { AgentsCommissionsPage } from '../pages/operations/AgentsCommissionsPage';
import { ExpensesPage } from '../pages/operations/ExpensesPage';
import { RecurringBillsPage } from '../pages/operations/RecurringBillsPage';
import { TechniciansPage } from '../pages/operations/TechniciansPage';
import { PreventiveMaintenancePage } from '../pages/operations/PreventiveMaintenancePage';
import { DamagesManagementPage } from '../pages/operations/DamagesManagementPage';
import { WaterMetersPage } from '../pages/operations/WaterMetersPage';
import { HRPayrollPage } from '../pages/operations/HRPayrollPage';
import { EmployeeDetailPage } from '../pages/operations/EmployeeDetailPage';
import { ActivityLogPage } from '../pages/operations/ActivityLogPage';
import { ReportsPage } from '../pages/operations/ReportsPage';

// Owner
import { OwnerExecutiveDashboard } from '../pages/owner/OwnerExecutiveDashboard';

// Household
import { HouseholdDashboard } from '../pages/household/HouseholdDashboard';
import { HouseholdChecklistPage } from '../pages/household/HouseholdChecklistPage';
import { HouseholdTaskHistoryPage } from '../pages/household/HouseholdTaskHistoryPage';
import { HouseholdSalaryPage } from '../pages/household/HouseholdSalaryPage';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminPropertiesPage } from '../pages/admin/AdminPropertiesPage';
import { AdminPropertyEditPage } from '../pages/admin/AdminPropertyEditPage';
import { AdminBuildingsRoomsPage } from '../pages/admin/AdminBuildingsRoomsPage';
import { AdminRoomEditPage } from '../pages/admin/AdminRoomEditPage';
import { AdminRentalTypesPage } from '../pages/admin/AdminRentalTypesPage';
import { AdminUsersRolesPage } from '../pages/admin/AdminUsersRolesPage';
import { AdminSystemSettingsPage } from '../pages/admin/AdminSystemSettingsPage';

// Shared
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/room/:id" element={<RoomDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Client Portal */}
      <Route path="/client" element={<DashboardLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="my-booking" element={<MyBookingPage />} />
        <Route path="my-room" element={<MyRoomPage />} />
        <Route path="payments" element={<ClientPaymentsPage />} />
        <Route path="my-materials" element={<MyMaterialsPage />} />
        <Route path="report-issue" element={<ReportIssuePage />} />
        <Route path="notifications" element={<ClientNotificationsPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      {/* Operations Manager */}
      <Route path="/operations" element={<DashboardLayout />}>
        <Route index element={<OperationsDashboard />} />
        <Route path="bookings" element={<BookingsManagementPage />} />
        <Route path="clients" element={<ClientsManagementPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="properties" element={<PropertiesManagementPage />} />
        <Route path="payments" element={<PaymentsManagementPage />} />
        <Route path="agents" element={<AgentsCommissionsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="recurring-bills" element={<RecurringBillsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="preventive-maintenance" element={<PreventiveMaintenancePage />} />
        <Route path="damages" element={<DamagesManagementPage />} />
        <Route path="water-meters" element={<WaterMetersPage />} />
        <Route path="hr-payroll" element={<HRPayrollPage />} />
        <Route path="hr-payroll/:id" element={<EmployeeDetailPage />} />
        <Route path="activity-log" element={<ActivityLogPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<ClientNotificationsPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      {/* Owner Executive */}
      <Route path="/owner" element={<DashboardLayout />}>
        <Route index element={<OwnerExecutiveDashboard />} />
        <Route path="properties" element={<PropertiesManagementPage />} />
        <Route path="financials" element={<ExpensesPage />} />
        <Route path="occupancy" element={<PropertiesManagementPage />} />
        <Route path="clients" element={<ClientsManagementPage />} />
        <Route path="maintenance" element={<PreventiveMaintenancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<ClientNotificationsPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      {/* Household Staff */}
      <Route path="/household" element={<DashboardLayout />}>
        <Route index element={<HouseholdDashboard />} />
        <Route path="checklist" element={<HouseholdChecklistPage />} />
        <Route path="tasks" element={<HouseholdChecklistPage />} />
        <Route path="history" element={<HouseholdTaskHistoryPage />} />
        <Route path="salary" element={<HouseholdSalaryPage />} />
        <Route path="notifications" element={<ClientNotificationsPage />} />
        <Route path="settings" element={<ProfileSettingsPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<DashboardLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="properties" element={<AdminPropertiesPage />} />
        <Route path="properties/new" element={<AdminPropertyEditPage />} />
        <Route path="properties/:id" element={<AdminPropertyEditPage />} />
        <Route path="buildings-rooms" element={<AdminBuildingsRoomsPage />} />
        <Route path="buildings-rooms/new" element={<AdminRoomEditPage />} />
        <Route path="buildings-rooms/:id" element={<AdminRoomEditPage />} />
        <Route path="rental-types" element={<AdminRentalTypesPage />} />
        <Route path="users" element={<AdminUsersRolesPage />} />
        <Route path="settings" element={<AdminSystemSettingsPage />} />
        <Route path="logs" element={<ActivityLogPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
