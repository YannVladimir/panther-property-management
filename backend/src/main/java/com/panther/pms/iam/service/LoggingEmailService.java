package com.panther.pms.iam.service;

import com.panther.pms.iam.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LoggingEmailService implements EmailService {

    @Override
    public void sendInvite(User user, String temporaryPassword) {
        log.info("[EMAIL STUB] Invite for {} — temporary password: {}", user.getEmail(), temporaryPassword);
    }

    @Override
    public void sendPasswordReset(User user, String resetToken) {
        log.info("[EMAIL STUB] Password reset for {} — token: {}", user.getEmail(), resetToken);
    }
}
