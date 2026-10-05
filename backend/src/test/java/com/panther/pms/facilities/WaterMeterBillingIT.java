package com.panther.pms.facilities;

import com.panther.pms.AbstractIntegrationTest;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
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
 * Codifies the water meter billing calculation and its cross-domain payment side effect —
 * manually verified live during Phase 5 (10 m³ × $1.75 = $17.50). Locks that math in against
 * regressions, including the billing-cycle rollover snapshotting history correctly.
 */
class WaterMeterBillingIT extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory testDataFactory;

    @Test
    void readingProducesExactConsumptionAndAmountAndPaymentCreatesALinkedUtilityPayment() throws Exception {
        var ops = testDataFactory.createUser(UserRole.OPERATIONS, "pw-ops");
        String token = loginAndGetToken(ops.getEmail(), "pw-ops");

        Property property = testDataFactory.createProperty();
        Room room = testDataFactory.createRoom(property);
        Client client = testDataFactory.createClient();
        testDataFactory.linkClientToRoom(client, room);

        String meterNumber = testDataFactory.unique("WM-");
        String assignJson = mockMvc.perform(post("/api/v1/water-meters")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "clientId", client.getId(),
                                "meterNumber", meterNumber,
                                "initialReading", 100,
                                "ratePerM3", 1.75))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long meterId = objectMapper.readTree(assignJson).get("id").asLong();

        // 10 m3 * $1.75 = $17.50
        mockMvc.perform(patch("/api/v1/water-meters/" + meterId + "/reading")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("currentReading", 110, "newBillingCycle", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumptionM3").value(10.0))
                .andExpect(jsonPath("$.totalAmount").value(17.5))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));

        mockMvc.perform(post("/api/v1/water-meters/" + meterId + "/payment")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("paymentMethod", "MOBILE_MONEY", "reference", "TEST-REF"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));

        String paymentsJson = mockMvc.perform(get("/api/v1/payments")
                        .header("Authorization", bearer(token))
                        .param("clientId", client.getId().toString())
                        .param("type", "UTILITY"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var content = objectMapper.readTree(paymentsJson).get("content");
        org.assertj.core.api.Assertions.assertThat(content).hasSize(1);
        org.assertj.core.api.Assertions.assertThat(content.get(0).get("amount").asDouble()).isEqualTo(17.5);
        org.assertj.core.api.Assertions.assertThat(content.get(0).get("status").asText()).isEqualTo("PAID");

        // New billing cycle: 125 - 110 = 15 m3, and the prior cycle should be snapshotted into history.
        mockMvc.perform(patch("/api/v1/water-meters/" + meterId + "/reading")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("currentReading", 125, "newBillingCycle", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumptionM3").value(15.0))
                .andExpect(jsonPath("$.totalAmount").value(26.25))
                .andExpect(jsonPath("$.history", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.history[0].consumption").value(10.0))
                .andExpect(jsonPath("$.history[0].amount").value(17.5));
    }
}
