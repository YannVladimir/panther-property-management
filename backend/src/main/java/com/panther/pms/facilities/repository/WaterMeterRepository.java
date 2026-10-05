package com.panther.pms.facilities.repository;

import com.panther.pms.facilities.entity.WaterMeter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WaterMeterRepository extends JpaRepository<WaterMeter, Long> {

    boolean existsByMeterNumber(String meterNumber);

    Optional<WaterMeter> findByClientId(Long clientId);
}
