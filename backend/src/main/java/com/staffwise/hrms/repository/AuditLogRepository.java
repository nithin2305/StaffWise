package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId);

    List<AuditLog> findByPerformedBy(String performedBy);

    @Query("SELECT a FROM AuditLog a WHERE a.performedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY a.performedAt DESC")
    List<AuditLog> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType " +
           "ORDER BY a.performedAt DESC")
    List<AuditLog> findByEntityTypeOrderByDateDesc(@Param("entityType") String entityType);

    @Query("SELECT a FROM AuditLog a WHERE a.action LIKE %:action% ORDER BY a.performedAt DESC")
    List<AuditLog> findByActionContaining(@Param("action") String action);
}
