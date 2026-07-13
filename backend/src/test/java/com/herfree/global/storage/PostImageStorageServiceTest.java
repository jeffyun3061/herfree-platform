package com.herfree.global.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.global.config.S3Properties;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.net.URL;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

class PostImageStorageServiceTest {

    private final S3Properties s3Properties =
            new S3Properties("test-bucket", "ap-northeast-2", null, null, "");
    private final S3Client s3Client = org.mockito.Mockito.mock(S3Client.class);
    private final S3Presigner s3Presigner = org.mockito.Mockito.mock(S3Presigner.class);
    private final PostImageStorageService service =
            new PostImageStorageService(s3Properties, s3Client, s3Presigner);

    @Test
    @DisplayName("presigned PUT 요청에는 검증된 Content-Length를 포함한다")
    void createUploadUrl_includesContentLengthInPutObjectRequest() throws Exception {
        PresignedPutObjectRequest presigned = org.mockito.Mockito.mock(PresignedPutObjectRequest.class);
        given(presigned.url()).willReturn(new URL("https://example.com/upload"));
        given(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class))).willReturn(presigned);

        service.createUploadUrl(1L, "image/png", 1234L);

        ArgumentCaptor<PutObjectPresignRequest> captor =
                ArgumentCaptor.forClass(PutObjectPresignRequest.class);
        verify(s3Presigner).presignPutObject(captor.capture());
        assertThat(captor.getValue().putObjectRequest().contentLength()).isEqualTo(1234L);
    }

    @Test
    @DisplayName("이미지 프록시 조회는 HEAD 크기가 10MB를 넘으면 GET 전에 차단한다")
    void fetchImageObject_tooLargeHead_blocksBeforeGet() {
        String objectKey = "posts/1/123e4567-e89b-12d3-a456-426614174000.png";
        given(s3Client.headObject(any(HeadObjectRequest.class))).willReturn(
                HeadObjectResponse.builder()
                        .contentType("image/png")
                        .contentLength(10L * 1024 * 1024 + 1)
                        .build());

        assertThatThrownBy(() -> service.fetchImageObject(objectKey))
                .isInstanceOfSatisfying(BusinessException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_IMAGE_SIZE));

        verify(s3Client, never()).getObject(any(GetObjectRequest.class));
    }

    @Test
    @DisplayName("이미지 프록시 조회는 HEAD Content-Type이 이미지가 아니면 차단한다")
    void fetchImageObject_invalidHeadContentType_blocksBeforeGet() {
        String objectKey = "posts/1/123e4567-e89b-12d3-a456-426614174000.png";
        given(s3Client.headObject(any(HeadObjectRequest.class))).willReturn(
                HeadObjectResponse.builder()
                        .contentType("text/html")
                        .contentLength(100L)
                        .build());

        assertThatThrownBy(() -> service.fetchImageObject(objectKey))
                .isInstanceOfSatisfying(BusinessException.class, ex ->
                        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_IMAGE_TYPE));

        verify(s3Client, never()).getObject(any(GetObjectRequest.class));
    }
}
