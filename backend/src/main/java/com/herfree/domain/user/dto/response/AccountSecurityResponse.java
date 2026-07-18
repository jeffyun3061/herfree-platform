package com.herfree.domain.user.dto.response;

public record AccountSecurityResponse(
        boolean passwordChangeAvailable
) {
}
