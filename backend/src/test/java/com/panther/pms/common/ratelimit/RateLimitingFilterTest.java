package com.panther.pms.common.ratelimit;

import com.panther.pms.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

/**
 * Pure unit test against the filter class directly (no Spring context, no Testcontainers) —
 * the filter is disabled in every *IT test (see src/test/resources/application.yml) because
 * MockMvc requests all share one client address and would otherwise trip the limiter across the
 * many logins performed by the wider IT suite sharing a cached Spring context. This is the only
 * place the limiting behavior itself is exercised.
 */
class RateLimitingFilterTest {

    private static final RateLimitProperties PROPS = new RateLimitProperties(true, 3, 60, 3, 60);

    @Test
    void blocksTheRequestOnceTheLimitIsExceededAndLetsOtherPathsThrough() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(PROPS);

        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest request = loginRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            filter.doFilterInternal(request, response, chain);

            verify(chain).doFilter(request, response);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest fourthRequest = loginRequest();
        MockHttpServletResponse fourthResponse = new MockHttpServletResponse();
        FilterChain fourthChain = mock(FilterChain.class);

        filter.doFilterInternal(fourthRequest, fourthResponse, fourthChain);

        assertThat(fourthResponse.getStatus()).isEqualTo(429);
        assertThat(fourthResponse.getContentAsString()).contains("Too many requests");
        verifyNoMoreInteractions(fourthChain);

        // A different, unrestricted path is never rate-limited.
        MockHttpServletRequest otherRequest = new MockHttpServletRequest("GET", "/api/v1/properties");
        otherRequest.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse otherResponse = new MockHttpServletResponse();
        FilterChain otherChain = mock(FilterChain.class);

        filter.doFilterInternal(otherRequest, otherResponse, otherChain);

        verify(otherChain).doFilter(otherRequest, otherResponse);
    }

    @Test
    void disabledFilterNeverBlocks() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(new RateLimitProperties(false, 1, 60, 1, 60));

        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = loginRequest();
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);

            filter.doFilterInternal(request, response, chain);

            verify(chain).doFilter(request, response);
        }
    }

    private MockHttpServletRequest loginRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("10.0.0.1");
        return request;
    }
}
