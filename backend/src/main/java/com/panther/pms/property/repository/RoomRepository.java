package com.panther.pms.property.repository;

import com.panther.pms.property.entity.Room;
import com.panther.pms.property.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {

    long countByPropertyId(Long propertyId);

    long countByBuildingId(Long buildingId);

    long countByStatus(RoomStatus status);

    @Query("select r.status as status, count(r) as count from Room r where r.property.id = :propertyId group by r.status")
    List<RoomStatusCount> countGroupedByStatusForProperty(@Param("propertyId") Long propertyId);
}
