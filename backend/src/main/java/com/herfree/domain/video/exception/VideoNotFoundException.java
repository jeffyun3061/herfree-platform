package com.herfree.domain.video.exception;

import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;

public class VideoNotFoundException extends BusinessException {

    public VideoNotFoundException() {
        super(ErrorCode.VIDEO_NOT_FOUND);
    }
}
