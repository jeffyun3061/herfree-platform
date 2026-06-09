package com.herfree.domain.product.controller;

import com.herfree.domain.product.dto.request.ProductCreateRequest;
import com.herfree.domain.product.dto.request.ProductUpdateRequest;
import com.herfree.domain.product.dto.request.ProductVisibilityRequest;
import com.herfree.domain.product.dto.response.ProductResponse;
import com.herfree.domain.product.service.ProductService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 제품 관리자 API — ROLE_ADMIN 권한 전용
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.createProduct(request)));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateProduct(productId, request)));
    }

    @PatchMapping("/{productId}/visibility")
    public ResponseEntity<ApiResponse<Void>> updateVisibility(
            @PathVariable Long productId,
            @RequestBody ProductVisibilityRequest request
    ) {
        productService.updateVisibility(productId, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
