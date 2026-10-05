package com.panther.pms.testsupport;

import com.panther.pms.facilities.entity.Technician;
import com.panther.pms.facilities.entity.TechnicianSpecialization;
import com.panther.pms.facilities.repository.TechnicianRepository;
import com.panther.pms.hr.entity.Department;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.hr.entity.EmploymentStatus;
import com.panther.pms.hr.repository.EmployeeRepository;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.repository.UserRepository;
import com.panther.pms.leasing.entity.Agent;
import com.panther.pms.leasing.entity.AgentStatus;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.leasing.repository.AgentRepository;
import com.panther.pms.leasing.repository.ClientRepository;
import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.PropertyStatus;
import com.panther.pms.property.entity.RentalType;
import com.panther.pms.property.entity.RentalTypeStatus;
import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import com.panther.pms.property.repository.PropertyRepository;
import com.panther.pms.property.repository.RentalTypeRepository;
import com.panther.pms.property.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Direct-to-repository fixture creation for integration tests — fast, and deliberately bypasses
 * the HTTP layer since these are test *inputs*, not the thing under test. Every identifier is
 * randomized (never a fixed id) because the Postgres container — and therefore its data — is
 * shared across the whole test JVM (see AbstractIntegrationTest).
 */
@Component
public class TestDataFactory {

    private static final AtomicLong SEQ = new AtomicLong(System.nanoTime());

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RentalTypeRepository rentalTypeRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private AgentRepository agentRepository;
    @Autowired private TechnicianRepository technicianRepository;

    public String unique(String prefix) {
        return prefix + SEQ.incrementAndGet();
    }

    public User createUser(UserRole role, String rawPassword) {
        return createUser(role, rawPassword, null, null);
    }

    public User createUser(UserRole role, String rawPassword, Long clientId, Long employeeId) {
        User user = User.builder()
                .name(unique("Test User "))
                .email(unique("user") + "@test.panther.rw")
                .role(role)
                .clientId(clientId)
                .employeeId(employeeId)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(UserStatus.ACTIVE)
                .mustChangePassword(false)
                .build();
        return userRepository.save(user);
    }

    public Property createProperty() {
        return createProperty(PropertyStatus.ACTIVE);
    }

    public Property createProperty(PropertyStatus status) {
        Property property = Property.builder()
                .name(unique("Test Estate "))
                .code(unique("TE"))
                .location("Test Location")
                .status(status)
                .build();
        return propertyRepository.save(property);
    }

    public Room createRoom(Property property) {
        Room room = Room.builder()
                .property(property)
                .roomNumber(unique("R-"))
                .furnishingType(FurnishingType.SELF_FURNISHED)
                .monthlyRent(new BigDecimal("200"))
                .status(RoomStatus.AVAILABLE)
                .build();
        return roomRepository.save(room);
    }

    public RentalType createRentalType() {
        RentalType rentalType = RentalType.builder()
                .name(FurnishingType.SELF_FURNISHED)
                .priceMultiplier(BigDecimal.ONE)
                .status(RentalTypeStatus.ACTIVE)
                .build();
        try {
            return rentalTypeRepository.save(rentalType);
        } catch (RuntimeException e) {
            // FurnishingType is a small closed enum with a unique constraint on `name` — a prior
            // test class may already have created one for this value under the shared container.
            return rentalTypeRepository.findAll().stream()
                    .filter(rt -> rt.getName() == FurnishingType.SELF_FURNISHED)
                    .findFirst()
                    .orElseThrow(() -> e);
        }
    }

    public Client createClient() {
        Client client = Client.builder()
                .name(unique("Test Client "))
                .email(unique("client") + "@test.panther.rw")
                .phone("+250700000000")
                .build();
        return clientRepository.save(client);
    }

    /** Some flows (e.g. water meter assignment) require a client to already have a current room/property. */
    public Client linkClientToRoom(Client client, Room room) {
        client.setCurrentRoom(room);
        client.setCurrentProperty(room.getProperty());
        return clientRepository.save(client);
    }

    public Employee createEmployee() {
        Employee employee = Employee.builder()
                .name(unique("Test Employee "))
                .position("Caretaker")
                .department(Department.MAINTENANCE)
                .contact("+250700000001")
                .employmentStatus(EmploymentStatus.FULL_TIME)
                .startDate(LocalDate.now().minusYears(1))
                .basicSalary(new BigDecimal("250"))
                .build();
        return employeeRepository.save(employee);
    }

    public Agent createAgent() {
        Agent agent = Agent.builder()
                .name(unique("Test Agent "))
                .phone("+250700000002")
                .email(unique("agent") + "@test.panther.rw")
                .status(AgentStatus.ACTIVE)
                .commissionRatePercent(new BigDecimal("10"))
                .build();
        return agentRepository.save(agent);
    }

    public Technician createTechnician() {
        Technician technician = Technician.builder()
                .name(unique("Test Technician "))
                .contact("+250700000003")
                .specialization(TechnicianSpecialization.GENERAL_MAINTENANCE)
                .build();
        return technicianRepository.save(technician);
    }
}
