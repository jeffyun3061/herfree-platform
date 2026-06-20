package com.herfree.domain.product.controller;

import com.herfree.domain.product.dto.request.ProductCreateRequest;
import com.herfree.domain.product.dto.request.ProductUpdateRequest;
import com.herfree.domain.product.dto.request.ProductVisibilityRequest;
import com.herfree.domain.product.dto.response.ProductResponse;
import com.herfree.domain.product.service.ProductService;
import com.herfree.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(productService.createProduct(request)));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateProduct(productId, request)));
    }

    @PatchMapping("/{productId}/visibility")
    public ResponseEntity<ApiResponse<ProductResponse>> updateVisibility(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVisibilityRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateVisibility(productId, request)));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
