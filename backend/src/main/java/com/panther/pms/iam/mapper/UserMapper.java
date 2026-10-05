package com.panther.pms.iam.mapper;

import com.panther.pms.iam.dto.UserResponse;
import com.panther.pms.iam.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);
}
