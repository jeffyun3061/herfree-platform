package com.herfree.domain.journal.entity;

import com.herfree.domain.user.entity.User;
import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Table(name = "journal_records")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JournalRecord extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MedicationStatus medicationStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SleepRange avgSleep;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private StressLevel stressLevel;

    @Column(nullable = false)
    private boolean hadSymptoms;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> prodromalSymptoms = new ArrayList<>();

    private Integer severity;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> triggers = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MoodType mood;

    @Column(precision = 3, scale = 1)
    private BigDecimal sleepHours;

    @Column(nullable = false)
    private boolean supplementTaken;

    @Column(nullable = false)
    private boolean exerciseDone;

    @Builder
    private JournalRecord(
            User user,
            LocalDate recordDate,
            MedicationStatus medicationStatus,
            SleepRange avgSleep,
            StressLevel stressLevel,
            boolean hadSymptoms,
            List<String> prodromalSymptoms,
            Integer severity,
            List<String> triggers,
            String memo,
            MoodType mood,
            BigDecimal sleepHours,
            boolean supplementTaken,
            boolean exerciseDone
    ) {
        this.user = user;
        this.recordDate = recordDate;
        this.medicationStatus = medicationStatus;
        this.avgSleep = avgSleep;
        this.stressLevel = stressLevel;
        this.hadSymptoms = hadSymptoms;
        this.prodromalSymptoms = prodromalSymptoms != null ? prodromalSymptoms : new ArrayList<>();
        this.severity = severity;
        this.triggers = triggers != null ? triggers : new ArrayList<>();
        this.memo = memo;
        this.mood = mood;
        this.sleepHours = sleepHours;
        this.supplementTaken = supplementTaken;
        this.exerciseDone = exerciseDone;
    }

    public void update(
            MedicationStatus medicationStatus,
            SleepRange avgSleep,
            StressLevel stressLevel,
            boolean hadSymptoms,
            List<String> prodromalSymptoms,
            Integer severity,
            List<String> triggers,
            String memo,
            MoodType mood,
            BigDecimal sleepHours,
            boolean supplementTaken,
            boolean exerciseDone
    ) {
        this.medicationStatus = medicationStatus;
        this.avgSleep = avgSleep;
        this.stressLevel = stressLevel;
        this.hadSymptoms = hadSymptoms;
        this.prodromalSymptoms = prodromalSymptoms != null ? prodromalSymptoms : new ArrayList<>();
        this.severity = hadSymptoms ? severity : null;
        this.triggers = hadSymptoms ? (triggers != null ? triggers : new ArrayList<>()) : new ArrayList<>();
        this.memo = memo;
        this.mood = mood;
        this.sleepHours = sleepHours;
        this.supplementTaken = supplementTaken;
        this.exerciseDone = exerciseDone;
    }
}
