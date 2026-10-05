package com.panther.pms.iam;

import com.panther.pms.config.SeedProperties;
import com.panther.pms.iam.entity.SystemSettings;
import com.panther.pms.iam.entity.User;
import com.panther.pms.iam.entity.UserRole;
import com.panther.pms.iam.entity.UserStatus;
import com.panther.pms.iam.repository.SystemSettingsRepository;
import com.panther.pms.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seeds a first ADMIN account and the default system settings row so the API is usable
 * immediately after `docker-compose up`. Never seeds a hardcoded password hash into
 * source control — the password is read from config/env at startup instead
 * (see panther.seed.* in application.yml).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final SeedProperties seedProperties;
    private final UserRepository userRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedProperties.enabled()) {
            return;
        }
        seedAdminUser();
        seedSystemSettings();
    }

    private void seedAdminUser() {
        if (userRepository.count() > 0) {
            return;
        }
        User admin = User.builder()
                .name(seedProperties.adminName())
                .email(seedProperties.adminEmail())
                .passwordHash(passwordEncoder.encode(seedProperties.adminPassword()))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .mustChangePassword(true)
                .build();
        userRepository.save(admin);
        log.info("Seeded default admin user '{}'. Change the password on first login.", admin.getEmail());
    }

    private void seedSystemSettings() {
        if (systemSettingsRepository.count() > 0) {
            return;
        }
        systemSettingsRepository.save(SystemSettings.builder()
                .companyName("Panther Living Ltd")
                .currencyCode("USD")
                .waterRatePerM3(new BigDecimal("1.75"))
                .defaultAgentCommissionPct(new BigDecimal("10"))
                .vatTaxRatePct(new BigDecimal("18"))
                .build());
        log.info("Seeded default system settings.");
    }
}
