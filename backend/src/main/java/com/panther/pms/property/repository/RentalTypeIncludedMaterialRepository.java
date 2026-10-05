package com.panther.pms.property.repository;

import com.panther.pms.property.entity.RentalTypeIncludedMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Needed by the leasing domain (Phase 3) to look up the rental-tier material *template*
 * a client's actual assigned ClientMaterial was derived from.
 */
public interface RentalTypeIncludedMaterialRepository extends JpaRepository<RentalTypeIncludedMaterial, Long> {
}
