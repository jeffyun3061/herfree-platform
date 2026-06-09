package com.herfree.domain.product.service;

import com.herfree.domain.product.dto.request.ProductCreateRequest;
import com.herfree.domain.product.dto.request.ProductUpdateRequest;
import com.herfree.domain.product.dto.request.ProductVisibilityRequest;
import com.herfree.domain.product.dto.response.ProductResponse;
import com.herfree.domain.product.entity.Product;
import com.herfree.domain.product.exception.ProductNotFoundException;
import com.herfree.domain.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(Pageable pageable) {
        return productRepository.findByIsVisibleTrueOrderByCreatedAtDesc(pageable)
                .map(ProductResponse::from);
    }

    // 제품 단건 조회 — 조회 시 clickCount를 증가시킨다.
    // 목록 조회에서는 카운트하지 않고 상세 조회에서만 카운트해 정확도를 높인다.
    @Transactional
    public ProductResponse getProduct(Long productId) {
        Product product = productRepository.findByIdAndIsVisibleTrue(productId)
                .orElseThrow(ProductNotFoundException::new);
        product.incrementClickCount();
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = Product.builder()
                .name(request.name())
                .category(request.category())
                .imageUrl(request.imageUrl())
                .description(request.description())
                .price(request.price())
                .externalUrl(request.externalUrl())
                .build();
        productRepository.save(product);
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);
        product.update(request.name(), request.category(), request.description(),
                request.price(), request.externalUrl());
        return ProductResponse.from(product);
    }

    @Transactional
    public void updateVisibility(Long productId, ProductVisibilityRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);
        product.toggleVisibility(request.isVisible());
    }
}
