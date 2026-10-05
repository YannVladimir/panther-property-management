package com.panther.pms.hr;

import com.panther.pms.AbstractIntegrationTest;
import com.panther.pms.hr.entity.Employee;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.testsupport.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Codifies the employee leave → status-sync business rule (ACTIVE ⇄ ON_LEAVE), manually
 * verified live in all three states during Phase 6. Mirrors DataContext.tsx's exact rule:
 * status is ON_LEAVE iff at least one leave record is currently APPROVED.
 */
class LeaveStatusSyncIT extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory testDataFactory;

    @Test
    void approvingALeaveSetsOnLeaveAndCompletingItRevertsToActive() throws Exception {
        var ops = testDataFactory.createUser(UserRole.OPERATIONS, "pw-ops");
        String token = loginAndGetToken(ops.getEmail(), "pw-ops");
        Employee employee = testDataFactory.createEmployee();

        assertEmployeeStatus(employee.getId(), token, "ACTIVE");

        String leaveJson = mockMvc.perform(post("/api/v1/employees/" + employee.getId() + "/leaves")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "leaveType", "ANNUAL_LEAVE",
                                "startDate", "2026-09-01",
                                "endDate", "2026-09-05",
                                "daysCount", 5,
                                "reason", "Vacation"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        long leaveId = objectMapper.readTree(leaveJson).get("id").asLong();

        // A merely-requested (pending) leave must not change the employee's status.
        assertEmployeeStatus(employee.getId(), token, "ACTIVE");

        mockMvc.perform(patch("/api/v1/employees/" + employee.getId() + "/leaves/" + leaveId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "APPROVED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.approvedByName").value(ops.getName()));
        assertEmployeeStatus(employee.getId(), token, "ON_LEAVE");

        mockMvc.perform(patch("/api/v1/employees/" + employee.getId() + "/leaves/" + leaveId)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
                .andExpect(status().isOk());
        assertEmployeeStatus(employee.getId(), token, "ACTIVE");
    }

    private void assertEmployeeStatus(Long employeeId, String token, String expectedStatus) throws Exception {
        mockMvc.perform(get("/api/v1/employees/" + employeeId).header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(expectedStatus));
    }
}
