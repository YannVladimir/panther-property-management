package com.panther.pms.property.repository;

import com.panther.pms.property.entity.RoomStatus;

/** Projection for the grouped "how many rooms of each status does this property have" query. */
public interface RoomStatusCount {
    RoomStatus getStatus();
    Long getCount();
}
