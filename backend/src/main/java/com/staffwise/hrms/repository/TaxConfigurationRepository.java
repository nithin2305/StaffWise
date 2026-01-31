package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.TaxConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface TaxConfigurationRepository extends JpaRepository<TaxConfiguration, Long> {

    Optional<TaxConfiguration> findByFinancialYear(String financialYear);

    @Query("SELECT tc FROM TaxConfiguration tc WHERE tc.isActive = true AND :date BETWEEN tc.startDate AND tc.endDate ORDER BY tc.startDate DESC LIMIT 1")
    Optional<TaxConfiguration> findActiveConfigurationForDate(@Param("date") LocalDate date);

    @Query("SELECT tc FROM TaxConfiguration tc WHERE tc.isActive = true ORDER BY tc.startDate DESC LIMIT 1")
    Optional<TaxConfiguration> findCurrentActiveConfiguration();
}
