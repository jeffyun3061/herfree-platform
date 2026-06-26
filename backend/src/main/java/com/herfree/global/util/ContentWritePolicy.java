package com.herfree.global.util;

import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public final class ContentWritePolicy {

    private ContentWritePolicy() {
    }

    public static boolean canWrite(UserRole role) {
        if (role == null) {
            return false;
        }
        return StaffRolePolicy.isStaff(role)
                || role == UserRole.DOCTOR
                || role == UserRole.CREATOR;
    }

    public static void assertCanWrite(UserRole role) {
        if (!canWrite(role)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
    }
}
