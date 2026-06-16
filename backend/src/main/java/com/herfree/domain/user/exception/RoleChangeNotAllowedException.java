package com.herfree.domain.user.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class RoleChangeNotAllowedException extends BusinessException {

    public RoleChangeNotAllowedException() {
        super(ErrorCode.ROLE_CHANGE_NOT_ALLOWED);
    }
}
