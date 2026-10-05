package com.panther.pms.leasing;

import com.panther.pms.AbstractIntegrationTest;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.RentalType;
import com.panther.pms.property.entity.Room;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.testsupport.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Codifies the booking state machine's side effects — server-enforced rules the frontend mock
 * only ever narrated (see BACKEND_PLAN.md section 8), and which were manually verified live
 * during Phase 3. This test locks that behavior in against regressions.
 */
class BookingLifecycleIT extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory testDataFactory;

    @Test
    void assignRoomReservesTheRoomAndCheckInThenCompleteDriveRoomAndClientState() throws Exception {
        var ops = testDataFactory.createUser(UserRole.OPERATIONS, "pw-ops");
        String opsToken = loginAndGetToken(ops.getEmail(), "pw-ops");

        Property property = testDataFactory.createProperty();
        Room room = testDataFactory.createRoom(property);
        RentalType rentalType = testDataFactory.createRentalType();
        Client client = testDataFactory.createClient();

        // 1. Create a booking already linked to the client (as operations would, on their behalf).
        Map<String, Object> createBody = Map.of(
                "clientId", client.getId(),
                "clientName", client.getName(),
                "propertyId", property.getId(),
                "rentalTypeId", rentalType.getId(),
                "moveInDate", "2026-09-01",
                "monthlyRent", 300
        );
        String bookingJson = mockMvc.perform(post("/api/v1/bookings")
                        .header("Authorization", bearer(opsToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUESTED"))
                .andReturn().getResponse().getContentAsString();
        long bookingId = objectMapper.readTree(bookingJson).get("id").asLong();

        // 2. Assign the room — booking -> ROOM_ASSIGNED, room -> RESERVED.
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/assign-room")
                        .header("Authorization", bearer(opsToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("roomId", room.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ROOM_ASSIGNED"))
                .andExpect(jsonPath("$.roomId").value(room.getId()));
        assertThat(fetchRoomStatus(room.getId(), opsToken)).isEqualTo("RESERVED");

        // 3. Check in — room -> OCCUPIED, client's currentRoom set.
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .header("Authorization", bearer(opsToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "CHECKED_IN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"));
        assertThat(fetchRoomStatus(room.getId(), opsToken)).isEqualTo("OCCUPIED");
        assertThat(fetchClientCurrentRoomId(client.getId(), opsToken)).isEqualTo(room.getId());

        // 4. Complete (move-out) — room -> AVAILABLE, client -> FORMER.
        mockMvc.perform(patch("/api/v1/bookings/" + bookingId + "/status")
                        .header("Authorization", bearer(opsToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        assertThat(fetchRoomStatus(room.getId(), opsToken)).isEqualTo("AVAILABLE");
        assertThat(fetchClientStatus(client.getId(), opsToken)).isEqualTo("FORMER");
    }

    @Test
    void anonymousVisitorCanSubmitABookingInquiryWithNoToken() throws Exception {
        Property property = testDataFactory.createProperty();
        RentalType rentalType = testDataFactory.createRentalType();

        Map<String, Object> body = Map.of(
                "clientName", "Anonymous Prospect",
                "clientEmail", "prospect@example.com",
                "propertyId", property.getId(),
                "rentalTypeId", rentalType.getId(),
                "moveInDate", "2026-10-01",
                "monthlyRent", 250
        );

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REQUESTED"))
                .andExpect(jsonPath("$.timeline[0].updatedByName").value("Anonymous Prospect"));
    }

    private String fetchRoomStatus(Long roomId, String token) throws Exception {
        String json = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/rooms/" + roomId).header("Authorization", bearer(token)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("status").asText();
    }

    private Long fetchClientCurrentRoomId(Long clientId, String token) throws Exception {
        String json = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/clients/" + clientId).header("Authorization", bearer(token)))
                .andReturn().getResponse().getContentAsString();
        var node = objectMapper.readTree(json).get("currentRoomId");
        return node == null || node.isNull() ? null : node.asLong();
    }

    private String fetchClientStatus(Long clientId, String token) throws Exception {
        String json = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/clients/" + clientId).header("Authorization", bearer(token)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(json).get("status").asText();
    }
}
