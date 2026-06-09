package com.herfree.domain.product.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProductUpdateRequest(

        @NotBlank String name,

        @NotBlank String category,

        String description,

        Integer price,

        String externalUrl
) {
}
