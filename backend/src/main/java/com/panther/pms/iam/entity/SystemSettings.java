package com.panther.pms.iam.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Single-row global configuration table (see AdminSystemSettingsPage). The service layer
 * enforces a singleton by always reading/writing the lowest-id row.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SystemSettings extends BaseEntity {

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "currency_code", nullable = false, length = 10)
    private String currencyCode;

    @Column(name = "water_rate_per_m3", nullable = false, precision = 8, scale = 2)
    private BigDecimal waterRatePerM3;

    @Column(name = "default_agent_commission_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal defaultAgentCommissionPct;

    @Column(name = "vat_tax_rate_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatTaxRatePct;

    @Column(name = "updated_by")
    private Long updatedBy;
}
