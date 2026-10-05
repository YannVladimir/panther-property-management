package com.panther.pms.property.repository;

import com.panther.pms.property.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {

    boolean existsByCodeIgnoreCase(String code);
}
