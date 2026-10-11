package com.herfree.domain.operations;

import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.global.response.ApiResponse;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class OperatorTasksController {
    private final PostRepository posts;
    private final ReportRepository reports;
    public record Queue(String boardType, long pending, long overdue, Instant oldest) {}
    public record Task(Long id, String boardType, Instant createdAt) {}
    public record Tasks(Instant generatedAt, long overdueReports, List<Queue> queues, List<Task> oldestTasks) {}

    @GetMapping("/api/admin/operator/tasks")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Tasks>> tasks() {
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(86400);
        var queues = posts.summarizeWaitingReplies(cutoff).stream()
                .map(row -> new Queue(row.getBoardType(), row.getPending(), row.getOverdue(), row.getOldest())).toList();
        var oldest = posts.findWaitingReplies(PageRequest.of(0, 5)).stream()
                .map(row -> new Task(row.getId(), row.getBoardType(), row.getCreatedAt())).toList();
        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(ApiResponse.success(new Tasks(now,
                reports.countByStatusAndCreatedAtBefore(ReportStatus.PENDING, cutoff), queues, oldest)));
    }
}
