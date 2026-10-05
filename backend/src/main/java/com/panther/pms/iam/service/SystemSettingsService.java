package com.panther.pms.iam.service;

import com.panther.pms.iam.dto.SystemSettingsResponse;
import com.panther.pms.iam.dto.UpdateSystemSettingsRequest;
import com.panther.pms.iam.entity.SystemSettings;
import com.panther.pms.iam.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The table is designed to hold a single row; we always operate on the lowest id.
 */
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository repository;

    public SystemSettingsResponse get() {
        return toResponse(singletonRow());
    }

    @Transactional
    public SystemSettingsResponse update(UpdateSystemSettingsRequest request, Long updatedByUserId) {
        SystemSettings settings = singletonRow();
        settings.setCompanyName(request.companyName());
        settings.setCurrencyCode(request.currencyCode());
        settings.setWaterRatePerM3(request.waterRatePerM3());
        settings.setDefaultAgentCommissionPct(request.defaultAgentCommissionPct());
        settings.setVatTaxRatePct(request.vatTaxRatePct());
        settings.setUpdatedBy(updatedByUserId);
        return toResponse(repository.save(settings));
    }

    private SystemSettings singletonRow() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .findFirst()
                .orElseGet(() -> repository.save(SystemSettings.builder()
                        .companyName("Panther Living Ltd")
                        .currencyCode("USD ($)")
                        .waterRatePerM3(new java.math.BigDecimal("1.75"))
                        .defaultAgentCommissionPct(new java.math.BigDecimal("10"))
                        .vatTaxRatePct(new java.math.BigDecimal("18"))
                        .build()));
    }

    private SystemSettingsResponse toResponse(SystemSettings s) {
        return new SystemSettingsResponse(
                s.getCompanyName(), s.getCurrencyCode(), s.getWaterRatePerM3(),
                s.getDefaultAgentCommissionPct(), s.getVatTaxRatePct());
    }
}
