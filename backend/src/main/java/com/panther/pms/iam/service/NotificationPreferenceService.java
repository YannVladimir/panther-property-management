package com.panther.pms.iam.service;

import com.panther.pms.iam.dto.NotificationPreferencesRequest;
import com.panther.pms.iam.dto.NotificationPreferencesResponse;
import com.panther.pms.iam.entity.NotificationPreference;
import com.panther.pms.iam.repository.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;

    public NotificationPreferencesResponse get(Long userId) {
        NotificationPreference pref = findOrDefault(userId);
        return toResponse(pref);
    }

    @Transactional
    public NotificationPreferencesResponse update(Long userId, NotificationPreferencesRequest request) {
        NotificationPreference pref = repository.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).build());

        pref.setEmailNotifications(request.emailNotifications());
        pref.setSmsNotifications(request.smsNotifications());
        pref.setThemePreference(request.themePreference());

        return toResponse(repository.save(pref));
    }

    private NotificationPreference findOrDefault(Long userId) {
        return repository.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).build());
    }

    private NotificationPreferencesResponse toResponse(NotificationPreference pref) {
        return new NotificationPreferencesResponse(
                pref.isEmailNotifications(), pref.isSmsNotifications(), pref.getThemePreference());
    }
}
