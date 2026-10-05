package com.panther.pms.iam.service;

import com.panther.pms.iam.entity.User;

/**
 * Stubbed for now (see BACKEND_PLAN.md section 9) — wire to a real provider
 * (SendGrid / SES / Africa's Talking) when that decision is made.
 */
public interface EmailService {

    void sendInvite(User user, String temporaryPassword);

    void sendPasswordReset(User user, String resetToken);
}
