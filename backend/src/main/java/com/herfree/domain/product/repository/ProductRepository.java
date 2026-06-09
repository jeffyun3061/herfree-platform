package com.herfree.domain.product.repository;

import com.herfree.domain.product.entity.Product;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);

    Optional<Product> findByIdAndIsVisibleTrue(Long id);
}
