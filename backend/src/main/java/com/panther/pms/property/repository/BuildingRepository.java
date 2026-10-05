package com.panther.pms.property.repository;

import com.panther.pms.property.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Long> {

    List<Building> findByPropertyId(Long propertyId);
}
