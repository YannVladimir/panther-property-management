package com.panther.pms.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.panther.pms.common.EmergencyContact;
import com.panther.pms.common.audit.ActivityLog;
import com.panther.pms.common.audit.ActivityLogRepository;
import com.panther.pms.common.audit.ActivityType;
import com.panther.pms.config.LegacySeedProperties;
import com.panther.pms.facilities.entity.DamageReport;
import com.panther.pms.facilities.entity.DamageStatus;
import com.panther.pms.facilities.entity.InspectionStatus;
import com.panther.pms.facilities.entity.IssueCategory;
import com.panther.pms.facilities.entity.IssuePriority;
import com.panther.pms.facilities.entity.IssueStatus;
import com.panther.pms.facilities.entity.MaintenanceIssue;
import com.panther.pms.facilities.entity.PreventiveCategory;
import com.panther.pms.facilities.entity.PreventiveFrequency;
import com.panther.pms.facilities.entity.PreventiveTask;
import com.panther.pms.facilities.entity.ResponsibleParty;
import com.panther.pms.facilities.entity.TechDocument;
import com.panther.pms.facilities.entity.TechDocumentStatus;
import com.panther.pms.facilities.entity.TechDocumentType;
import com.panther.pms.facilities.entity.TechPayoutMethod;
import com.panther.pms.facilities.entity.TechWorkOrder;
import com.panther.pms.facilities.entity.Technician;
import com.panther.pms.facilities.entity.TechnicianAvailability;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.facilities.entity.WaterMeter;
import com.panther.pms.facilities.entity.WaterMeterReading;
import com.panther.pms.facilities.entity.WaterPaymentStatus;
import com.panther.pms.facilities.entity.WorkOrderCategory;
import com.panther.pms.facilities.entity.WorkOrderPaymentStatus;
import com.panther.pms.facilities.entity.WorkOrderPriority;
import com.panther.pms.facilities.entity.WorkOrderStatus;
import com.panther.pms.facilities.repository.DamageReportRepository;
import com.panther.pms.facilities.repository.MaintenanceIssueRepository;
import com.panther.pms.facilities.repository.PreventiveTaskRepository;
import com.panther.pms.facilities.repository.TechnicianRepository;
import com.panther.pms.facilities.repository.WaterMeterRepository;
import com.panther.pms.finance.entity.BillFrequency;
import com.panther.pms.finance.entity.Expense;
import com.panther.pms.finance.entity.ExpenseCategory;
import com.panther.pms.finance.entity.ExpenseStatus;
import com.panther.pms.finance.entity.Payment;
import com.panther.pms.finance.entity.PaymentMethod;
import com.panther.pms.finance.entity.PaymentStatus;
import com.panther.pms.finance.entity.PaymentType;
import com.panther.pms.finance.entity.PayrollPaymentStatus;
import com.panther.pms.finance.entity.PayrollRecord;
import com.panther.pms.finance.entity.RecurringBill;
import com.panther.pms.finance.entity.RecurringBillCategory;
import com.panther.pms.finance.entity.RecurringBillStatus;
import com.panther.pms.finance.repository.ExpenseRepository;
import com.panther.pms.finance.repository.PaymentRepository;
import com.panther.pms.finance.repository.PayrollRecordRepository;
import com.panther.pms.finance.repository.RecurringBillRepository;
import com.panther.pms.hr.entity.DailyTaskStatus;
import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.hr.entity.EmployeeDailyTask;
import com.panther.pms.hr.entity.EmployeeDamage;
import com.panther.pms.hr.entity.EmployeeDamageStatus;
import com.panther.pms.hr.entity.EmployeeDocument;
import com.panther.pms.hr.entity.EmployeeDocumentStatus;
import com.panther.pms.hr.entity.EmployeeDocumentType;
import com.panther.pms.hr.entity.EmployeeStatus;
import com.panther.pms.hr.entity.EmploymentStatus;
import com.panther.pms.hr.entity.TaskPriority;
import com.panther.pms.hr.repository.EmployeeRepository;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.leasing.entity.Agent;
import com.panther.pms.leasing.entity.AgentDeal;
import com.panther.pms.leasing.entity.AgentDealStatus;
import com.panther.pms.leasing.entity.AgentStatus;
import com.panther.pms.leasing.entity.Booking;
import com.panther.pms.leasing.entity.BookingSource;
import com.panther.pms.leasing.entity.BookingStatus;
import com.panther.pms.leasing.entity.BookingTimelineEvent;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.entity.ClientMaterial;
import com.panther.pms.leasing.entity.ClientMaterialCondition;
import com.panther.pms.leasing.entity.ClientPaymentStatus;
import com.panther.pms.leasing.entity.ClientStatus;
import com.panther.pms.leasing.entity.PayoutMethod;
import com.panther.pms.leasing.repository.AgentRepository;
import com.panther.pms.leasing.repository.BookingRepository;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.platform.entity.Notification;
import com.panther.pms.platform.entity.NotificationRecipient;
import com.panther.pms.platform.entity.NotificationType;
import com.panther.pms.platform.repository.NotificationRecipientRepository;
import com.panther.pms.platform.repository.NotificationRepository;
import com.panther.pms.property.entity.Building;
import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.RentalType;
import com.panther.pms.property.entity.RentalTypeIncludedMaterial;
import com.panther.pms.property.entity.RentalTypeStatus;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.BuildingRepository;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RentalTypeRepository;
import com.panther.pms.property.repository.RoomRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * One-time import of real frontend mock data (see DATA_MIGRATION_PLAN.md) into the real
 * database — reuses the actual JPA entity classes with in-memory legacy-id -> real-id maps,
 * rather than hand-written natural-key-subquery SQL across ~40 tables. Gated by
 * panther.legacy-seed.enabled (default false) plus a hard skip if properties already exist.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.LOWEST_PRECEDENCE)
public class LegacySeedRunner implements ApplicationRunner {

    private final LegacySeedProperties legacySeedProperties;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BuildingRepository buildingRepository;
    private final RentalTypeRepository rentalTypeRepository;
    private final RoomRepository roomRepository;
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final AgentRepository agentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final RecurringBillRepository recurringBillRepository;
    private final TechnicianRepository technicianRepository;
    private final PreventiveTaskRepository preventiveTaskRepository;
    private final DamageReportRepository damageReportRepository;
    private final WaterMeterRepository waterMeterRepository;
    private final MaintenanceIssueRepository maintenanceIssueRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;

    private final Map<String, Property> properties = new HashMap<>();
    private final Map<String, Building> buildings = new HashMap<>();
    private final Map<String, RentalType> rentalTypes = new HashMap<>();
    private final Map<String, Room> rooms = new HashMap<>();
    private final Map<String, Client> clients = new HashMap<>();
    private final Map<String, Employee> employees = new HashMap<>();
    private final Map<String, Agent> agents = new HashMap<>();
    private final Map<String, Technician> technicians = new HashMap<>();
    private final Map<String, User> users = new HashMap<>();

    private int propertyCount, buildingCount, rentalTypeCount, includedMaterialCount, roomCount,
            clientCount, clientMaterialCount, userCount, agentCount, agentDealCount, bookingCount,
            timelineEventCount, paymentCount, expenseCount, recurringBillCount, technicianCount,
            workOrderCount, techDocumentCount, preventiveTaskCount, damageReportCount, waterMeterCount,
            waterMeterHistoryCount, employeeCount, employeeDocumentCount, dailyTaskCount, employeeDamageCount,
            payrollRecordCount, maintenanceIssueCount, activityLogCount, notificationCount, recipientCount;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (!legacySeedProperties.enabled()) {
            return;
        }
        if (propertyRepository.count() > 0) {
            log.warn("Legacy seed skipped: properties table is not empty.");
            return;
        }

        JsonNode root = objectMapper.readTree(
                new ClassPathResource("legacy-seed/legacy-seed-data.json").getInputStream());

        seedProperties(root.get("properties"));
        seedBuildings(root.get("buildings"));
        seedRentalTypes(root.get("rentalTypes"));
        seedRooms(root.get("rooms"));
        seedAgents(root.get("agents"));
        seedClients(root.get("clients"));
        seedEmployees(root.get("employees"));
        backfillRoomCurrentClients(root.get("rooms"));
        seedUsers(root.get("users"));
        seedBookings(root.get("bookings"));
        seedPayments(root.get("payments"));
        seedExpenses(root.get("expenses"));
        seedRecurringBills(root.get("recurringBills"));
        seedTechnicians(root.get("technicians"));
        seedPreventiveTasks(root.get("preventiveTasks"));
        seedDamageReports(root.get("damageReports"));
        seedWaterMeters(root.get("waterMeters"));
        seedMaintenanceIssues(root.get("maintenanceIssues"));
        seedPayrollRecords(root.get("payrollRecords"));
        seedActivityLogs(root.get("activityLogs"));
        seedNotifications(root.get("notifications"));

        log.info("""
                Legacy seed complete:
                properties={} buildings={} rentalTypes={} includedMaterials={} rooms={}
                clients={} clientMaterials={} users={} agents={} agentDeals={}
                bookings={} timelineEvents={} payments={} expenses={} recurringBills={}
                technicians={} workOrders={} techDocuments={} preventiveTasks={} damageReports={}
                waterMeters={} waterMeterHistory={} employees={} employeeDocuments={} dailyTasks={}
                employeeDamages={} payrollRecords={} maintenanceIssues={} activityLogs={} notifications={} recipients={}
                """,
                propertyCount, buildingCount, rentalTypeCount, includedMaterialCount, roomCount,
                clientCount, clientMaterialCount, userCount, agentCount, agentDealCount,
                bookingCount, timelineEventCount, paymentCount, expenseCount, recurringBillCount,
                technicianCount, workOrderCount, techDocumentCount, preventiveTaskCount, damageReportCount,
                waterMeterCount, waterMeterHistoryCount, employeeCount, employeeDocumentCount, dailyTaskCount,
                employeeDamageCount, payrollRecordCount, maintenanceIssueCount, activityLogCount, notificationCount, recipientCount);
    }

    // ---------------------------------------------------------------- property domain

    private void seedProperties(JsonNode array) {
        for (JsonNode n : array) {
            Property p = Property.builder()
                    .name(text(n, "name"))
                    .code(text(n, "code"))
                    .location(text(n, "location"))
                    .neighborhood(text(n, "neighborhood"))
                    .city(text(n, "city"))
                    .address(text(n, "address"))
                    .description(text(n, "description"))
                    .rating(decimal(n, "rating"))
                    .reviewCount(intVal(n, "reviewCount"))
                    .featured(boolVal(n, "featured"))
                    .yearBuilt(intVal(n, "yearBuilt"))
                    .monthlyRevenueEstimate(decimal(n, "monthlyRevenueEstimate"))
                    .images(stringList(n.get("images")))
                    .amenities(stringList(n.get("amenities")))
                    .build();
            properties.put(text(n, "legacyId"), propertyRepository.save(p));
            propertyCount++;
        }
    }

    private void seedBuildings(JsonNode array) {
        for (JsonNode n : array) {
            Building b = Building.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .name(text(n, "name"))
                    .floorsCount(intVal(n, "floorsCount"))
                    .build();
            buildings.put(text(n, "legacyId"), buildingRepository.save(b));
            buildingCount++;
        }
    }

    private void seedRentalTypes(JsonNode array) {
        for (JsonNode n : array) {
            RentalType rt = RentalType.builder()
                    .name(FurnishingType.valueOf(text(n, "name")))
                    .description(text(n, "description"))
                    .priceMultiplier(decimal(n, "priceMultiplier"))
                    .status(RentalTypeStatus.valueOf(text(n, "status")))
                    .build();
            for (JsonNode propId : n.get("applicablePropertyLegacyIds")) {
                rt.getApplicableProperties().add(properties.get(propId.asText()));
            }
            rt = rentalTypeRepository.save(rt);
            for (JsonNode m : n.get("includedMaterials")) {
                rt.getIncludedMaterials().add(RentalTypeIncludedMaterial.builder()
                        .rentalType(rt)
                        .name(text(m, "name"))
                        .quantity(intVal(m, "quantity"))
                        .condition(text(m, "condition"))
                        .category(text(m, "category"))
                        .build());
                includedMaterialCount++;
            }
            rentalTypeRepository.flush();
            rentalTypes.put(text(n, "legacyId"), rt);
            rentalTypeCount++;
        }
    }

    private void seedRooms(JsonNode array) {
        for (JsonNode n : array) {
            Room r = Room.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .building(buildings.get(text(n, "buildingLegacyId")))
                    .roomNumber(text(n, "roomNumber"))
                    .floor(intVal(n, "floor"))
                    .sizeSqM(decimal(n, "sizeSqM"))
                    .bedrooms(intVal(n, "bedrooms"))
                    .bathrooms(intVal(n, "bathrooms"))
                    .furnishingType(FurnishingType.valueOf(text(n, "furnishingType")))
                    .monthlyRent(decimal(n, "monthlyRent"))
                    .deposit(decimal(n, "deposit"))
                    .status(RoomStatus.valueOf(text(n, "status")))
                    .virtualTourUrl(text(n, "virtualTourUrl"))
                    .description(text(n, "description"))
                    .amenities(stringList(n.get("amenities")))
                    .utilitiesIncluded(stringList(n.get("utilitiesIncluded")))
                    .rules(stringList(n.get("rules")))
                    .images(stringList(n.get("images")))
                    .build();
            rooms.put(text(n, "legacyId"), roomRepository.save(r));
            roomCount++;
        }
    }

    /** Room.currentClientId can only be resolved after clients exist (mutual FK dependency with Client.currentRoom). */
    private void backfillRoomCurrentClients(JsonNode array) {
        for (JsonNode n : array) {
            String clientLegacyId = text(n, "currentClientLegacyId");
            if (clientLegacyId == null) continue;
            Room room = rooms.get(text(n, "legacyId"));
            room.setCurrentClientId(clients.get(clientLegacyId).getId());
            roomRepository.save(room);
        }
    }

    // ---------------------------------------------------------------- leasing domain

    private void seedClients(JsonNode array) {
        for (JsonNode n : array) {
            String roomLegacyId = text(n, "currentRoomLegacyId");
            Client c = Client.builder()
                    .name(text(n, "name"))
                    .email(text(n, "email"))
                    .phone(text(n, "phone"))
                    .avatarUrl(text(n, "avatarUrl"))
                    .identificationNumber(text(n, "identificationNumber"))
                    .nationality(text(n, "nationality"))
                    .occupation(text(n, "occupation"))
                    .employer(text(n, "employer"))
                    .emergencyContact(emergencyContact(n.get("emergencyContact")))
                    .currentRoom(roomLegacyId != null ? rooms.get(roomLegacyId) : null)
                    .currentProperty(text(n, "currentPropertyLegacyId") != null ? properties.get(text(n, "currentPropertyLegacyId")) : null)
                    .rentalType(FurnishingType.valueOf(text(n, "rentalType")))
                    .moveInDate(localDate(n, "moveInDate"))
                    .leaseExpiryDate(localDate(n, "leaseExpiryDate"))
                    .monthlyRent(decimal(n, "monthlyRent"))
                    .depositPaid(decimal(n, "depositPaid"))
                    .paymentStatus(ClientPaymentStatus.valueOf(text(n, "paymentStatus")))
                    .status(ClientStatus.valueOf(text(n, "status")))
                    .deactivationReason(text(n, "deactivationReason"))
                    .deactivatedDate(localDate(n, "deactivatedDate"))
                    .notes(text(n, "notes"))
                    .build();
            c = clientRepository.save(c);
            for (JsonNode m : n.get("materials")) {
                c.getMaterials().add(ClientMaterial.builder()
                        .client(c)
                        .name(text(m, "name"))
                        .quantity(intVal(m, "quantity"))
                        .condition(ClientMaterialCondition.valueOf(text(m, "condition")))
                        .assignedDate(localDate(m, "assignedDate"))
                        .serialNumber(text(m, "serialNumber"))
                        .category(text(m, "category"))
                        .build());
                clientMaterialCount++;
            }
            clientRepository.flush();
            clients.put(text(n, "legacyId"), c);
            clientCount++;
        }
    }

    private void seedAgents(JsonNode array) {
        for (JsonNode n : array) {
            Agent a = Agent.builder()
                    .name(text(n, "name"))
                    .agency(text(n, "agency"))
                    .phone(text(n, "phone"))
                    .email(text(n, "email"))
                    .avatarUrl(text(n, "avatarUrl"))
                    .status(AgentStatus.valueOf(text(n, "status")))
                    .commissionRatePercent(decimal(n, "commissionRatePercent"))
                    .paymentMethod(text(n, "paymentMethod") != null ? PayoutMethod.valueOf(text(n, "paymentMethod")) : null)
                    .payoutAccount(text(n, "payoutAccount"))
                    .notes(text(n, "notes"))
                    .build();
            a = agentRepository.save(a);
            for (JsonNode d : n.get("deals")) {
                a.getDeals().add(AgentDeal.builder()
                        .agent(a)
                        .clientName(text(d, "clientName"))
                        .clientEmail(text(d, "clientEmail"))
                        .clientPhone(text(d, "clientPhone"))
                        .property(properties.get(text(d, "propertyLegacyId")))
                        .room(text(d, "roomLegacyId") != null ? rooms.get(text(d, "roomLegacyId")) : null)
                        .rentalType(text(d, "rentalType"))
                        .monthlyRent(decimal(d, "monthlyRent"))
                        .commissionPercentage(decimal(d, "commissionPercentage"))
                        .commissionAmount(decimal(d, "commissionAmount"))
                        .dealDate(localDate(d, "dealDate"))
                        .status(AgentDealStatus.valueOf(text(d, "status")))
                        .payoutDate(localDate(d, "payoutDate"))
                        .payoutReference(text(d, "payoutReference"))
                        .notes(text(d, "notes"))
                        .build());
                agentDealCount++;
            }
            agentRepository.flush();
            agents.put(text(n, "legacyId"), a);
            agentCount++;
        }
    }

    private void seedBookings(JsonNode array) {
        for (JsonNode n : array) {
            String clientLegacyId = text(n, "clientLegacyId");
            String roomLegacyId = text(n, "roomLegacyId");
            String agentLegacyId = text(n, "agentLegacyId");
            Booking b = Booking.builder()
                    .bookingNumber(text(n, "bookingNumber"))
                    .client(clientLegacyId != null ? clients.get(clientLegacyId) : null)
                    .clientName(text(n, "clientName"))
                    .clientEmail(text(n, "clientEmail"))
                    .clientPhone(text(n, "clientPhone"))
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .room(roomLegacyId != null ? rooms.get(roomLegacyId) : null)
                    .rentalType(rentalTypes.get(text(n, "rentalTypeLegacyId")))
                    .requestedDate(instant(n, "requestedDate"))
                    .moveInDate(localDate(n, "moveInDate"))
                    .moveOutDate(localDate(n, "moveOutDate"))
                    .monthlyRent(decimal(n, "monthlyRent"))
                    .deposit(decimal(n, "deposit"))
                    .status(BookingStatus.valueOf(text(n, "status")))
                    .notes(text(n, "notes"))
                    .source(text(n, "source") != null ? BookingSource.valueOf(text(n, "source")) : null)
                    .agent(agentLegacyId != null ? agents.get(agentLegacyId) : null)
                    .build();
            b = bookingRepository.save(b);
            for (JsonNode t : n.get("timeline")) {
                b.getTimeline().add(BookingTimelineEvent.builder()
                        .booking(b)
                        .status(BookingStatus.valueOf(text(t, "status")))
                        .occurredAt(instant(t, "occurredAt"))
                        .note(text(t, "note"))
                        .updatedByName(text(t, "updatedByName"))
                        .build());
                timelineEventCount++;
            }
            bookingRepository.flush();
            bookingCount++;
        }
    }

    // ---------------------------------------------------------------- hr domain

    private void seedEmployees(JsonNode array) {
        for (JsonNode n : array) {
            Employee e = Employee.builder()
                    .name(text(n, "name"))
                    .avatarUrl(text(n, "avatarUrl"))
                    .position(text(n, "position"))
                    .department(Department.valueOf(text(n, "department")))
                    .contact(text(n, "contact"))
                    .email(text(n, "email"))
                    .employmentStatus(EmploymentStatus.valueOf(text(n, "employmentStatus")))
                    .status(EmployeeStatus.valueOf(text(n, "status")))
                    .statusReason(text(n, "statusReason"))
                    .startDate(localDate(n, "startDate"))
                    .basicSalary(decimal(n, "basicSalary"))
                    .nationalId(text(n, "nationalId"))
                    .emergencyContact(emergencyContact(n.get("emergencyContact")))
                    .address(text(n, "address"))
                    .build();
            e = employeeRepository.save(e);
            for (JsonNode d : n.get("documents")) {
                e.getDocuments().add(EmployeeDocument.builder()
                        .employee(e)
                        .name(text(d, "name"))
                        .type(EmployeeDocumentType.valueOf(text(d, "type")))
                        .fileUrl(text(d, "fileUrl"))
                        .uploadDate(localDate(d, "uploadDate"))
                        .sizeLabel(text(d, "sizeLabel"))
                        .status(EmployeeDocumentStatus.valueOf(text(d, "status")))
                        .build());
                employeeDocumentCount++;
            }
            for (JsonNode t : n.get("dailyTasks")) {
                String propId = text(t, "propertyLegacyId");
                e.getDailyTasks().add(EmployeeDailyTask.builder()
                        .employee(e)
                        .title(text(t, "title"))
                        .description(text(t, "description"))
                        .assignedDate(localDate(t, "assignedDate"))
                        .dueDate(localDate(t, "dueDate"))
                        .priority(TaskPriority.valueOf(text(t, "priority")))
                        .property(propId != null ? properties.get(propId) : null)
                        .roomNumber(text(t, "roomNumber"))
                        .status(DailyTaskStatus.valueOf(text(t, "status")))
                        .completedDate(localDate(t, "completedDate"))
                        .managerComment(text(t, "managerComment"))
                        .rating(intValOrNull(t, "rating"))
                        .ratedByName(text(t, "ratedByName"))
                        .build());
                dailyTaskCount++;
            }
            for (JsonNode d : n.get("damages")) {
                e.getDamages().add(EmployeeDamage.builder()
                        .employee(e)
                        .incidentDate(localDate(d, "incidentDate"))
                        .item(text(d, "item"))
                        .propertyName(text(d, "propertyName"))
                        .roomNumber(text(d, "roomNumber"))
                        .description(text(d, "description"))
                        .estimatedCost(decimal(d, "estimatedCost"))
                        .deductedFromSalary(boolVal(d, "deductedFromSalary"))
                        .deductedAmount(decimal(d, "deductedAmount"))
                        .status(EmployeeDamageStatus.valueOf(text(d, "status")))
                        .photos(stringList(d.get("photos")))
                        .build());
                employeeDamageCount++;
            }
            employeeRepository.flush();
            employees.put(text(n, "legacyId"), e);
            employeeCount++;
        }
    }

    // ---------------------------------------------------------------- iam domain

    private void seedUsers(JsonNode array) {
        for (JsonNode n : array) {
            String email = text(n, "email");
            User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user == null) {
                user = User.builder().email(email).build();
            }
            String clientLegacyId = text(n, "clientLegacyId");
            String employeeLegacyId = text(n, "employeeLegacyId");
            user.setName(text(n, "name"));
            user.setPhone(text(n, "phone"));
            user.setPasswordHash(passwordEncoder.encode(text(n, "password")));
            user.setRole(UserRole.valueOf(text(n, "role")));
            user.setAvatarUrl(text(n, "avatarUrl"));
            user.setTitle(text(n, "title"));
            user.setClientId(clientLegacyId != null ? clients.get(clientLegacyId).getId() : null);
            user.setEmployeeId(employeeLegacyId != null ? employees.get(employeeLegacyId).getId() : null);
            user.setStatus(UserStatus.ACTIVE);
            user.setMustChangePassword(boolVal(n, "mustChangePassword"));
            user = userRepository.save(user);
            users.put(text(n, "legacyId"), user);
            userCount++;
        }
    }

    // ---------------------------------------------------------------- finance domain

    private void seedPayments(JsonNode array) {
        for (JsonNode n : array) {
            Payment p = Payment.builder()
                    .invoiceNumber(text(n, "invoiceNumber"))
                    .client(clients.get(text(n, "clientLegacyId")))
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .room(rooms.get(text(n, "roomLegacyId")))
                    .amount(decimal(n, "amount"))
                    .date(localDate(n, "date"))
                    .dueDate(localDate(n, "dueDate"))
                    .type(PaymentType.valueOf(text(n, "type")))
                    .method(PaymentMethod.valueOf(text(n, "method")))
                    .reference(text(n, "reference"))
                    .status(PaymentStatus.valueOf(text(n, "status")))
                    .receiptUrl(text(n, "receiptUrl"))
                    .notes(text(n, "notes"))
                    .build();
            paymentRepository.save(p);
            paymentCount++;
        }
    }

    private void seedExpenses(JsonNode array) {
        for (JsonNode n : array) {
            Expense e = Expense.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .category(ExpenseCategory.valueOf(text(n, "category")))
                    .description(text(n, "description"))
                    .amount(decimal(n, "amount"))
                    .date(localDate(n, "date"))
                    .vendor(text(n, "vendor"))
                    .paymentMethod(PaymentMethod.valueOf(text(n, "paymentMethod")))
                    .status(ExpenseStatus.valueOf(text(n, "status")))
                    .receiptAttached(boolVal(n, "receiptAttached"))
                    .notes(text(n, "notes"))
                    .build();
            expenseRepository.save(e);
            expenseCount++;
        }
    }

    private void seedRecurringBills(JsonNode array) {
        for (JsonNode n : array) {
            RecurringBill r = RecurringBill.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .name(text(n, "name"))
                    .category(RecurringBillCategory.valueOf(text(n, "category")))
                    .vendor(text(n, "vendor"))
                    .amount(decimal(n, "amount"))
                    .frequency(BillFrequency.valueOf(text(n, "frequency")))
                    .nextDueDate(localDate(n, "nextDueDate"))
                    .status(RecurringBillStatus.valueOf(text(n, "status")))
                    .autoRenew(boolVal(n, "autoRenew"))
                    .reminderDays(intVal(n, "reminderDays"))
                    .build();
            recurringBillRepository.save(r);
            recurringBillCount++;
        }
    }

    private void seedPayrollRecords(JsonNode array) {
        for (JsonNode n : array) {
            PayrollRecord p = PayrollRecord.builder()
                    .payrollNumber(text(n, "payrollNumber"))
                    .employeeId(employees.get(text(n, "employeeLegacyId")).getId())
                    .employeeName(text(n, "employeeName"))
                    .position(text(n, "position"))
                    .department(text(n, "department"))
                    .period(text(n, "period"))
                    .basicSalary(decimal(n, "basicSalary"))
                    .allowances(decimal(n, "allowances"))
                    .bonuses(decimal(n, "bonuses"))
                    .deductions(decimal(n, "deductions"))
                    .taxAmount(decimal(n, "taxAmount"))
                    .netSalary(decimal(n, "netSalary"))
                    .paymentDate(localDate(n, "paymentDate"))
                    .paymentStatus(PayrollPaymentStatus.valueOf(text(n, "paymentStatus")))
                    .paymentMethod(PaymentMethod.valueOf(text(n, "paymentMethod")))
                    .build();
            payrollRecordRepository.save(p);
            payrollRecordCount++;
        }
    }

    // ---------------------------------------------------------------- facilities domain

    private void seedTechnicians(JsonNode array) {
        for (JsonNode n : array) {
            Technician t = Technician.builder()
                    .name(text(n, "name"))
                    .company(text(n, "company"))
                    .contact(text(n, "contact"))
                    .email(text(n, "email"))
                    .avatarUrl(text(n, "avatarUrl"))
                    .specialization(TechnicianSpecialization.valueOf(text(n, "specialization")))
                    .rating(decimal(n, "rating"))
                    .availability(TechnicianAvailability.valueOf(text(n, "availability")))
                    .hourlyRate(decimal(n, "hourlyRate"))
                    .notes(text(n, "notes"))
                    .address(text(n, "address"))
                    .nationalId(text(n, "nationalId"))
                    .emergencyContact(emergencyContact(n.get("emergencyContact")))
                    .preferredPaymentMethod(text(n, "preferredPaymentMethod") != null ? TechPayoutMethod.valueOf(text(n, "preferredPaymentMethod")) : null)
                    .payoutAccount(text(n, "payoutAccount"))
                    .yearsExperience(intValOrNull(n, "yearsExperience"))
                    .certifications(stringList(n.get("certifications")))
                    .build();
            t = technicianRepository.save(t);
            for (JsonNode w : n.get("workOrders")) {
                String roomLegacyId = text(w, "roomLegacyId");
                t.getWorkOrders().add(TechWorkOrder.builder()
                        .technician(t)
                        .jobNumber(text(w, "jobNumber"))
                        .property(properties.get(text(w, "propertyLegacyId")))
                        .room(roomLegacyId != null ? rooms.get(roomLegacyId) : null)
                        .title(text(w, "title"))
                        .description(text(w, "description"))
                        .category(WorkOrderCategory.valueOf(text(w, "category")))
                        .priority(WorkOrderPriority.valueOf(text(w, "priority")))
                        .dispatchedDate(localDate(w, "dispatchedDate"))
                        .startDate(localDate(w, "startDate"))
                        .completedDate(localDate(w, "completedDate"))
                        .estimatedHours(decimal(w, "estimatedHours"))
                        .actualHours(decimal(w, "actualHours"))
                        .laborCost(decimal(w, "laborCost"))
                        .materialCost(decimal(w, "materialCost"))
                        .paymentStatus(WorkOrderPaymentStatus.valueOf(text(w, "paymentStatus")))
                        .paidAmount(decimal(w, "paidAmount"))
                        .status(WorkOrderStatus.valueOf(text(w, "status")))
                        .rating(intValOrNull(w, "rating"))
                        .ratingComment(text(w, "ratingComment"))
                        .notes(text(w, "notes"))
                        .photos(stringList(w.get("photos")))
                        .build());
                workOrderCount++;
            }
            for (JsonNode d : n.get("documents")) {
                t.getDocuments().add(TechDocument.builder()
                        .technician(t)
                        .name(text(d, "name"))
                        .type(TechDocumentType.valueOf(text(d, "type")))
                        .fileUrl(text(d, "fileUrl"))
                        .uploadDate(localDate(d, "uploadDate"))
                        .expiryDate(localDate(d, "expiryDate"))
                        .status(TechDocumentStatus.valueOf(text(d, "status")))
                        .build());
                techDocumentCount++;
            }
            technicianRepository.flush();
            technicians.put(text(n, "legacyId"), t);
            technicianCount++;
        }
    }

    private void seedPreventiveTasks(JsonNode array) {
        for (JsonNode n : array) {
            String staffLegacyId = text(n, "assignedStaffLegacyId");
            PreventiveTask p = PreventiveTask.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .category(PreventiveCategory.valueOf(text(n, "category")))
                    .taskName(text(n, "taskName"))
                    .frequency(PreventiveFrequency.valueOf(text(n, "frequency")))
                    .scheduleWeek(intVal(n, "scheduleWeek"))
                    .assignedStaffId(staffLegacyId != null ? employees.get(staffLegacyId).getId() : null)
                    .assignedStaffName(staffLegacyId != null ? employees.get(staffLegacyId).getName() : null)
                    .status(InspectionStatus.valueOf(text(n, "status")))
                    .remarks(text(n, "remarks"))
                    .dueDate(localDate(n, "dueDate"))
                    .lastCompletedDate(localDate(n, "lastCompletedDate"))
                    .resolvedDate(localDate(n, "resolvedDate"))
                    .evidencePhotos(stringList(n.get("evidencePhotos")))
                    .build();
            preventiveTaskRepository.save(p);
            preventiveTaskCount++;
        }
    }

    private void seedDamageReports(JsonNode array) {
        for (JsonNode n : array) {
            String clientLegacyId = text(n, "clientLegacyId");
            DamageReport d = DamageReport.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .room(rooms.get(text(n, "roomLegacyId")))
                    .client(clientLegacyId != null ? clients.get(clientLegacyId) : null)
                    .item(text(n, "item"))
                    .damageType(text(n, "damageType"))
                    .description(text(n, "description"))
                    .reportedDate(localDate(n, "reportedDate"))
                    .estimatedCost(decimal(n, "estimatedCost"))
                    .amountCharged(decimal(n, "amountCharged"))
                    .responsibleParty(ResponsibleParty.valueOf(text(n, "responsibleParty")))
                    .status(DamageStatus.valueOf(text(n, "status")))
                    .resolutionNotes(text(n, "resolutionNotes"))
                    .photos(stringList(n.get("photos")))
                    .build();
            damageReportRepository.save(d);
            damageReportCount++;
        }
    }

    private void seedWaterMeters(JsonNode array) {
        for (JsonNode n : array) {
            WaterMeter w = WaterMeter.builder()
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .room(rooms.get(text(n, "roomLegacyId")))
                    .client(clients.get(text(n, "clientLegacyId")))
                    .meterNumber(text(n, "meterNumber"))
                    .previousReading(decimal(n, "previousReading"))
                    .currentReading(decimal(n, "currentReading"))
                    .consumptionM3(decimal(n, "consumptionM3"))
                    .readingDate(localDate(n, "readingDate"))
                    .ratePerM3(decimal(n, "ratePerM3"))
                    .totalAmount(decimal(n, "totalAmount"))
                    .paymentStatus(WaterPaymentStatus.valueOf(text(n, "paymentStatus")))
                    .build();
            w = waterMeterRepository.save(w);
            for (JsonNode h : n.get("history")) {
                w.getHistory().add(WaterMeterReading.builder()
                        .waterMeter(w)
                        .periodMonth(text(h, "periodMonth"))
                        .reading(decimal(h, "reading"))
                        .consumption(decimal(h, "consumption"))
                        .amount(decimal(h, "amount"))
                        .build());
                waterMeterHistoryCount++;
            }
            waterMeterRepository.flush();
            waterMeterCount++;
        }
    }

    private void seedMaintenanceIssues(JsonNode array) {
        for (JsonNode n : array) {
            String techLegacyId = text(n, "assignedTechnicianLegacyId");
            MaintenanceIssue m = MaintenanceIssue.builder()
                    .ticketNumber(text(n, "ticketNumber"))
                    .client(clients.get(text(n, "clientLegacyId")))
                    .property(properties.get(text(n, "propertyLegacyId")))
                    .room(rooms.get(text(n, "roomLegacyId")))
                    .category(IssueCategory.valueOf(text(n, "category")))
                    .title(text(n, "title"))
                    .description(text(n, "description"))
                    .priority(IssuePriority.valueOf(text(n, "priority")))
                    .status(IssueStatus.valueOf(text(n, "status")))
                    .reportedDate(instant(n, "reportedDate"))
                    .assignedTechnician(techLegacyId != null ? technicians.get(techLegacyId) : null)
                    .resolutionDate(localDate(n, "resolutionDate"))
                    .resolutionNotes(text(n, "resolutionNotes"))
                    .photos(stringList(n.get("photos")))
                    .build();
            maintenanceIssueRepository.save(m);
            maintenanceIssueCount++;
        }
    }

    // ---------------------------------------------------------------- platform domain

    private void seedActivityLogs(JsonNode array) {
        for (JsonNode n : array) {
            String userLegacyId = text(n, "userLegacyId");
            ActivityLog a = ActivityLog.builder()
                    .occurredAt(instant(n, "occurredAt"))
                    .userId(userLegacyId != null ? users.get(userLegacyId).getId() : null)
                    .userName(text(n, "userName"))
                    .role(text(n, "role"))
                    .action(text(n, "action"))
                    .module(text(n, "module"))
                    .details(text(n, "details"))
                    .type(ActivityType.valueOf(text(n, "type")))
                    .build();
            activityLogRepository.save(a);
            activityLogCount++;
        }
    }

    private void seedNotifications(JsonNode array) {
        for (JsonNode n : array) {
            Instant occurredAt = instant(n, "occurredAt");
            boolean read = boolVal(n, "read");

            java.util.Set<UserRole> targetRoles = new java.util.HashSet<>();
            for (JsonNode r : n.get("targetRoles")) {
                targetRoles.add(UserRole.valueOf(r.asText()));
            }

            Notification notification = Notification.builder()
                    .title(text(n, "title"))
                    .message(text(n, "message"))
                    .type(NotificationType.valueOf(text(n, "type")))
                    .link(text(n, "link"))
                    .targetRoles(targetRoles)
                    .build();
            notification = notificationRepository.save(notification);

            for (User user : users.values()) {
                if (!targetRoles.contains(user.getRole())) continue;
                notification.getRecipients().add(NotificationRecipient.builder()
                        .notification(notification)
                        .user(user)
                        .readAt(read ? occurredAt : null)
                        .build());
                recipientCount++;
            }
            notificationRepository.flush();

            // BaseEntity.createdAt is Spring Data JPA auditing-managed (@CreatedDate), stamped
            // with the actual seeding run's wall-clock time on insert — a raw update is the
            // only way to backdate it to the historically-correct value derived from the mock's
            // relative-time string (see DATA_MIGRATION_PLAN.md issue #8).
            entityManager.createNativeQuery("UPDATE notifications SET created_at = :occurredAt WHERE id = :id")
                    .setParameter("occurredAt", occurredAt)
                    .setParameter("id", notification.getId())
                    .executeUpdate();

            notificationCount++;
        }
    }

    // ---------------------------------------------------------------- json helpers

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText();
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.decimalValue();
    }

    private static int intVal(JsonNode node, String field) {
        return node.get(field).asInt();
    }

    private static Integer intValOrNull(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asInt();
    }

    private static boolean boolVal(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v != null && v.asBoolean();
    }

    private static LocalDate localDate(JsonNode node, String field) {
        String s = text(node, field);
        return s == null ? null : LocalDate.parse(s);
    }

    private static Instant instant(JsonNode node, String field) {
        String s = text(node, field);
        return s == null ? null : Instant.parse(s);
    }

    private static List<String> stringList(JsonNode arrayNode) {
        List<String> result = new ArrayList<>();
        if (arrayNode == null) return result;
        for (JsonNode n : arrayNode) {
            result.add(n.asText());
        }
        return result;
    }

    private static EmergencyContact emergencyContact(JsonNode node) {
        if (node == null || node.isNull()) return null;
        return new EmergencyContact(text(node, "name"), text(node, "phone"), text(node, "relationship"));
    }
}
