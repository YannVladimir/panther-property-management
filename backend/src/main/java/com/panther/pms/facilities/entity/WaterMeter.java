package com.panther.pms.facilities.entity;

import com.panther.pms.common.BaseEntity;
import com.panther.pms.leasing.entity.Client;
import com.panther.pms.property.entity.Property;
import com.panther.pms.property.entity.Room;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "water_meters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WaterMeter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "meter_number", nullable = false, unique = true)
    private String meterNumber;

    @Column(name = "previous_reading", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal previousReading = BigDecimal.ZERO;

    @Column(name = "current_reading", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal currentReading = BigDecimal.ZERO;

    @Column(name = "consumption_m3", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal consumptionM3 = BigDecimal.ZERO;

    @Column(name = "reading_date")
    private LocalDate readingDate;

    @Column(name = "rate_per_m3", nullable = false, precision = 6, scale = 2)
    private BigDecimal ratePerM3;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private WaterPaymentStatus paymentStatus = WaterPaymentStatus.PAID;

    @OneToMany(mappedBy = "waterMeter", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id DESC")
    @Builder.Default
    private List<WaterMeterReading> history = new ArrayList<>();
}
