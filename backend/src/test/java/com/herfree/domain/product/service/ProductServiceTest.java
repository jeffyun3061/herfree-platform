package com.herfree.domain.product.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.product.dto.request.ProductCreateRequest;
import com.herfree.domain.product.entity.Product;
import com.herfree.domain.product.repository.ProductRepository;
import com.herfree.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    @DisplayName("제품 외부 링크는 HTTPS 주소만 허용한다")
    void createProduct_javascriptUrl_rejected() {
        ProductCreateRequest request = new ProductCreateRequest(
                "제품", "생활용품", null, null, 1000, "javascript:alert(1)");

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(BusinessException.class);
        verify(productRepository, never()).save(org.mockito.ArgumentMatchers.any(Product.class));
    }
}
