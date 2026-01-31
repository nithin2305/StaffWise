package com.staffwise.hrms.repository;

import com.staffwise.hrms.entity.TaxSlab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaxSlabRepository extends JpaRepository<TaxSlab, Long> {

    @Query("SELECT ts FROM TaxSlab ts WHERE ts.taxConfiguration.id = :configId AND ts.isResident = :isResident ORDER BY ts.slabOrder ASC")
    List<TaxSlab> findByConfigurationAndRegime(@Param("configId") Long configurationId, @Param("isResident") Boolean isResident);

    List<TaxSlab> findByTaxConfigurationIdOrderBySlabOrderAsc(Long configurationId);
}
