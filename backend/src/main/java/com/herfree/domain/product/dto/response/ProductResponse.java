package com.herfree.domain.product.dto.response;

import com.herfree.domain.product.entity.Product;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String name,
        String category,
        String imageUrl,
        String description,
        Integer price,
        String externalUrl,
        int clickCount,
        boolean isVisible,
        LocalDateTime createdAt
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getImageUrl(),
                product.getDescription(),
                product.getPrice(),
                product.getExternalUrl(),
                product.getClickCount(),
                product.isVisible(),
                product.getCreatedAt()
        );
    }
}
