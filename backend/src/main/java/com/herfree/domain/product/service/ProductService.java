package com.herfree.domain.product.service;

import com.herfree.domain.product.dto.request.ProductCreateRequest;
import com.herfree.domain.product.dto.request.ProductUpdateRequest;
import com.herfree.domain.product.dto.request.ProductVisibilityRequest;
import com.herfree.domain.product.dto.response.ProductResponse;
import com.herfree.domain.product.entity.Product;
import com.herfree.domain.product.exception.ProductNotFoundException;
import com.herfree.domain.product.repository.ProductRepository;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.net.URI;
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
                .name(request.name().trim())
                .category(request.category().trim())
                .imageUrl(normalizeImageUrl(request.imageUrl()))
                .description(normalizeOptional(request.description()))
                .price(request.price())
                .externalUrl(normalizeHttpsUrl(request.externalUrl()))
                .build();

        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, ProductUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.update(request.name().trim(), request.category().trim(), normalizeImageUrl(request.imageUrl()),
                normalizeOptional(request.description()), request.price(), normalizeHttpsUrl(request.externalUrl()));

        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse updateVisibility(Long productId, ProductVisibilityRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);

        product.updateVisibility(request.isVisible());
        return ProductResponse.from(product);
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(ProductNotFoundException::new);
        productRepository.delete(product);
    }

    private String normalizeImageUrl(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        if (normalized.startsWith("/") && !normalized.startsWith("//")) {
            return normalized;
        }
        return normalizeHttpsUrl(normalized);
    }

    private String normalizeHttpsUrl(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            return null;
        }
        try {
            URI uri = URI.create(normalized);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }
            return normalized;
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
