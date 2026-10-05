package com.panther.pms.platform;

import com.panther.pms.AbstractIntegrationTest;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.testsupport.TestDataFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Full permission-matrix regression sweep — see BACKEND_PLAN.md section 4.1. For every listed
 * endpoint, every non-listed role must get 403, and every listed role must NOT get 403 (2xx or a
 * business-logic 404 is fine; a role gate letting the request through to the handler is what's
 * under test here, not the handler's own correctness — that's covered by each domain's own
 * plan/tests). One shared fixture set for the whole class keeps this fast: 28 endpoints × 5
 * roles = 140 assertions from a single round of setup.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class RoleAccessMatrixIT extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory testDataFactory;

    private final Map<UserRole, String> tokens = new EnumMap<>(UserRole.class);

    private record Row(String path, Set<UserRole> allowed) {
    }

    @BeforeAll
    void setUpFixturesAndUsers() throws Exception {
        Client client = testDataFactory.createClient();
        Employee employee = testDataFactory.createEmployee();

        var clientUser = testDataFactory.createUser(UserRole.CLIENT, "pw-client", client.getId(), null);
        var householdUser = testDataFactory.createUser(UserRole.HOUSEHOLD, "pw-household", null, employee.getId());

        for (UserRole role : List.of(UserRole.ADMIN, UserRole.OPERATIONS, UserRole.OWNER)) {
            var user = testDataFactory.createUser(role, "pw-" + role);
            tokens.put(role, loginAndGetToken(user.getEmail(), "pw-" + role));
        }
        tokens.put(UserRole.CLIENT, loginAndGetToken(clientUser.getEmail(), "pw-client"));
        tokens.put(UserRole.HOUSEHOLD, loginAndGetToken(householdUser.getEmail(), "pw-household"));
    }

    private Stream<Row> matrix() {
        Set<UserRole> ops = EnumSet.of(UserRole.OPERATIONS);
        Set<UserRole> opsOwner = EnumSet.of(UserRole.OPERATIONS, UserRole.OWNER);
        Set<UserRole> opsOwnerAdmin = EnumSet.of(UserRole.OPERATIONS, UserRole.OWNER, UserRole.ADMIN);
        Set<UserRole> admin = EnumSet.of(UserRole.ADMIN);
        Set<UserRole> allAuthenticated = EnumSet.allOf(UserRole.class);

        return Stream.of(
                // Property domain — buildings require auth (any role) but aren't publicly listed.
                new Row("/api/v1/buildings", allAuthenticated),
                // Leasing domain
                new Row("/api/v1/clients", ops),
                new Row("/api/v1/clients/me", EnumSet.of(UserRole.CLIENT)),
                new Row("/api/v1/bookings", ops),
                new Row("/api/v1/agents", ops),
                // Finance domain
                new Row("/api/v1/payments", ops),
                new Row("/api/v1/expenses", opsOwner),
                new Row("/api/v1/recurring-bills", opsOwner),
                new Row("/api/v1/payroll-records", ops),
                new Row("/api/v1/payroll-records/me", EnumSet.of(UserRole.HOUSEHOLD, UserRole.OPERATIONS)),
                // Facilities domain
                new Row("/api/v1/technicians", opsOwner),
                new Row("/api/v1/preventive-tasks", opsOwner),
                new Row("/api/v1/damages", ops),
                new Row("/api/v1/water-meters", ops),
                new Row("/api/v1/maintenance-issues", ops),
                // HR domain
                new Row("/api/v1/employees", ops),
                new Row("/api/v1/employees/me", EnumSet.of(UserRole.HOUSEHOLD)),
                // IAM domain
                new Row("/api/v1/users", admin),
                new Row("/api/v1/settings", opsOwnerAdmin),
                // Platform domain
                new Row("/api/v1/activity-logs", opsOwnerAdmin),
                new Row("/api/v1/search?q=test", opsOwnerAdmin),
                new Row("/api/v1/dashboard/operations", ops),
                new Row("/api/v1/dashboard/owner", EnumSet.of(UserRole.OWNER)),
                new Row("/api/v1/dashboard/admin", admin),
                new Row("/api/v1/dashboard/client", EnumSet.of(UserRole.CLIENT)),
                new Row("/api/v1/dashboard/household", EnumSet.of(UserRole.HOUSEHOLD)),
                new Row("/api/v1/reports/occupancy", opsOwner)
        );
    }

    @TestFactory
    Stream<DynamicTest> permissionMatrix() {
        return matrix().flatMap(row -> tokens.keySet().stream().map(role -> {
            boolean shouldBeAllowed = row.allowed().contains(role);
            String name = (shouldBeAllowed ? "ALLOW " : "DENY  ") + role + " -> " + row.path();
            return DynamicTest.dynamicTest(name, () -> {
                var result = mockMvc.perform(get(row.path()).header("Authorization", bearer(tokens.get(role))));
                if (shouldBeAllowed) {
                    result.andExpect(r -> {
                        int sc = r.getResponse().getStatus();
                        org.assertj.core.api.Assertions.assertThat(sc)
                                .as("%s should NOT be forbidden from %s", role, row.path())
                                .isNotEqualTo(403);
                    });
                } else {
                    result.andExpect(status().isForbidden());
                }
            });
        }));
    }

    @TestFactory
    Stream<DynamicTest> publiclyBrowsableEndpointsNeedNoToken() {
        return Stream.of("/api/v1/properties", "/api/v1/rooms", "/api/v1/rental-types")
                .map(path -> DynamicTest.dynamicTest("PUBLIC -> " + path, () ->
                        mockMvc.perform(get(path)).andExpect(status().isOk())));
    }
}
