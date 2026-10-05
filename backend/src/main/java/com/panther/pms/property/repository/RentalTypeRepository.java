package com.panther.pms.property.repository;

import com.panther.pms.property.entity.FurnishingType;
import com.panther.pms.property.entity.RentalType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RentalTypeRepository extends JpaRepository<RentalType, Long> {

    boolean existsByName(FurnishingType name);
}
