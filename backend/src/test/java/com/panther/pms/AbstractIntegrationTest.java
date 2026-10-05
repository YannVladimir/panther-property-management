package com.panther.pms;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Shared base for every integration test. Deliberately NOT using @Testcontainers/@Container:
 * that JUnit extension starts/stops the container once per test CLASS, but every subclass here
 * inherits the exact same @DynamicPropertySource method, so Spring's test-context cache treats
 * their ApplicationContexts as identical and reuses the first class's (now-stale) datasource
 * properties — later classes end up pointed at a container that extension already stopped. The
 * fix is the standard Testcontainers "singleton container" pattern: start it once in a static
 * initializer for the whole test JVM and never stop it explicitly (Ryuk reaps it on JVM exit).
 * Tests must therefore use unique/random identifiers rather than assuming an empty database or
 * fixed ids — see the individual test classes for the pattern.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ExtendWith(SpringExtension.class)
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("panther_pms_test")
            .withUsername("test")
            .withPassword("test");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // MockMvc requests all share one client address, so the real per-IP rate limit would
        // otherwise trip across the many logins performed by the wider IT suite sharing this
        // cached Spring context — see RateLimitingFilterTest for the actual limiting behavior.
        registry.add("panther.security.rate-limit.enabled", () -> "false");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    /** Logs in via the real endpoint (not a security-context shortcut) and returns the access token. */
    protected String loginAndGetToken(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of("email", email, "password", password));
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}
