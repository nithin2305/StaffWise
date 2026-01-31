package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.PayrollConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PayrollConfigurationRepository extends JpaRepository<PayrollConfiguration, Long> {

    Optional<PayrollConfiguration> findByConfigName(String configName);

    @Query("SELECT pc FROM PayrollConfiguration pc WHERE pc.isActive = true " +
           "AND pc.effectiveFrom <= :date AND (pc.effectiveTo IS NULL OR pc.effectiveTo >= :date) " +
           "ORDER BY pc.effectiveFrom DESC LIMIT 1")
    Optional<PayrollConfiguration> findActiveConfigurationForDate(@Param("date") LocalDate date);

    @Query("SELECT pc FROM PayrollConfiguration pc WHERE pc.isActive = true ORDER BY pc.effectiveFrom DESC LIMIT 1")
    Optional<PayrollConfiguration> findCurrentActiveConfiguration();
}
