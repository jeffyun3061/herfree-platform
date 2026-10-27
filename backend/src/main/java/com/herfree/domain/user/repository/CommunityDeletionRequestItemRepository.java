package com.herfree.domain.user.repository;
import com.herfree.domain.user.entity.CommunityDeletionRequestItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CommunityDeletionRequestItemRepository extends JpaRepository<CommunityDeletionRequestItem, Long> {
    List<CommunityDeletionRequestItem> findByRequestIdOrderByIdAsc(Long requestId);
}
