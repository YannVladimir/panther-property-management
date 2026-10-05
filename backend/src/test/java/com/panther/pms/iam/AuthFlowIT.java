package com.panther.pms.iam;

import com.panther.pms.AbstractIntegrationTest;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.testsupport.TestDataFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthFlowIT extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory testDataFactory;

    @Test
    void loginSucceedsWithCorrectCredentialsAndFailsWithWrongPassword() throws Exception {
        var user = testDataFactory.createUser(UserRole.OPERATIONS, "correct-password");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", "correct-password"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.user.email").value(user.getEmail()));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meRequiresAValidTokenAndReturnsTheCallingUser() throws Exception {
        var user = testDataFactory.createUser(UserRole.OPERATIONS, "correct-password");
        String token = loginAndGetToken(user.getEmail(), "correct-password");

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.role").value("OPERATIONS"));

        // No token at all — genuinely anonymous, denied by @PreAuthorize as an access-control
        // decision (403), not an authentication failure.
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isForbidden());

        // A Bearer token WAS supplied but is garbage/expired — JwtAuthenticationFilter now rejects
        // this as 401 Unauthorized (not 403), so the frontend's silent-refresh-then-retry logic
        // (which only triggers on 401) actually fires instead of leaving every request that
        // outlives the 15-minute access-token TTL permanently and unrecoverably forbidden.
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshTokenIssuesAWorkingNewAccessToken() throws Exception {
        var user = testDataFactory.createUser(UserRole.OPERATIONS, "correct-password");

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", "correct-password"))))
                .andReturn().getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(loginResponse).get("refreshToken").asText();

        String refreshResponse = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String newAccessToken = objectMapper.readTree(refreshResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(newAccessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.getEmail()));

        // An access token must not itself work as a refresh token.
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", newAccessToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changePasswordRequiresTheCurrentPasswordAndThenTakesEffect() throws Exception {
        var user = testDataFactory.createUser(UserRole.OPERATIONS, "old-password");
        String token = loginAndGetToken(user.getEmail(), "old-password");

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "totally-wrong",
                                "newPassword", "new-password-123"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "old-password",
                                "newPassword", "new-password-123"))))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", "old-password"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", user.getEmail(), "password", "new-password-123"))))
                .andExpect(status().isOk());
    }
}
