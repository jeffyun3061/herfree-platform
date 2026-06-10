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

    // 상세 조회 시 clickCount를 증가시켜 관심도 지표를 수집한다
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

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.update(request.name(), request.category(), request.imageUrl(),
                request.description(), request.price(), request.externalUrl());

        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse updateVisibility(Long productId, ProductVisibilityRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.updateVisibility(request.isVisible());
        return ProductResponse.from(product);
    }
}
