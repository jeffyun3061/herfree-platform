package com.herfree.domain.product.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProductCreateRequest(

        @NotBlank String name,

        @NotBlank String category,

        String imageUrl,

        String description,

        Integer price,

        String externalUrl
) {
}
