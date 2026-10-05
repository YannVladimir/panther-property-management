package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/** Append-only ledger populated every billing cycle rollover — see WaterMeterService. */
@Entity
@Table(name = "water_meter_readings_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WaterMeterReading extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "water_meter_id", nullable = false)
    private WaterMeter waterMeter;

    @Column(name = "period_month", nullable = false, length = 20)
    private String periodMonth;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal reading;

    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal consumption;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
}
