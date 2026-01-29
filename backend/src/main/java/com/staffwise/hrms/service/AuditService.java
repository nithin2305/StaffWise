package com.staffwise.hrms.service;

import com.staffwise.hrms.entity.AuditLog;
import com.staffwise.hrms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String entityType, Long entityId, String action, String performedBy,
                          String oldValues, String newValues) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .oldValues(oldValues)
                .newValues(newValues)
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Audit log created: {} - {} - {} by {}", entityType, entityId, action, performedBy);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(String entityType, Long entityId, String action, String performedBy,
                          String oldValues, String newValues, String ipAddress, String userAgent) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .oldValues(oldValues)
                .newValues(newValues)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();

        auditLogRepository.save(auditLog);
    }

    public List<AuditLog> getAuditLogsByEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    public List<AuditLog> getAuditLogsByUser(String performedBy) {
        return auditLogRepository.findByPerformedBy(performedBy);
    }

    public List<AuditLog> getAuditLogsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findByDateRange(startDate, endDate);
    }

    public List<AuditLog> getPayrollAuditLogs() {
        return auditLogRepository.findByEntityTypeOrderByDateDesc("PayrollRun");
    }
}
