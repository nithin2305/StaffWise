package com.staffwise.hrms.controller;

import com.staffwise.hrms.dto.ApiResponse;
import com.staffwise.hrms.dto.TaxConfigurationDTO;
import com.staffwise.hrms.dto.TaxSlabDTO;
import com.staffwise.hrms.entity.TaxConfiguration;
import com.staffwise.hrms.entity.TaxSlab;
import com.staffwise.hrms.repository.TaxConfigurationRepository;
import com.staffwise.hrms.repository.TaxSlabRepository;
import com.staffwise.hrms.service.TaxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for Tax Configuration management.
 * Allows admins to configure PNG tax slabs and superannuation rates.
 */
@RestController
@RequestMapping("/api/admin/tax")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'PAYROLL_ADMIN')")
public class TaxConfigurationController {

    private final TaxConfigurationRepository taxConfigRepository;
    private final TaxSlabRepository taxSlabRepository;
    private final TaxService taxService;

    // ============ TAX CONFIGURATION ENDPOINTS ============

    @GetMapping("/configurations")
    public ResponseEntity<ApiResponse<List<TaxConfigurationDTO>>> getAllConfigurations() {
        List<TaxConfigurationDTO> configs = taxConfigRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(configs));
    }

    @GetMapping("/configurations/active")
    public ResponseEntity<ApiResponse<TaxConfigurationDTO>> getActiveConfiguration() {
        TaxConfiguration config = taxService.getCurrentConfiguration()
                .orElse(null);
        
        if (config == null) {
            return ResponseEntity.ok(ApiResponse.success("No active configuration found", null));
        }
        
        return ResponseEntity.ok(ApiResponse.success(mapToDTO(config)));
    }

    @GetMapping("/configurations/{id}")
    public ResponseEntity<ApiResponse<TaxConfigurationDTO>> getConfiguration(@PathVariable Long id) {
        TaxConfiguration config = taxConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax configuration not found"));
        return ResponseEntity.ok(ApiResponse.success(mapToDTO(config)));
    }

    @PostMapping("/configurations")
    public ResponseEntity<ApiResponse<TaxConfigurationDTO>> createConfiguration(
            @RequestBody TaxConfigurationDTO dto) {
        
        TaxConfiguration config = TaxConfiguration.builder()
                .financialYear(dto.getFinancialYear())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .superEmployeePercentage(dto.getSuperEmployeePercentage())
                .superEmployerPercentage(dto.getSuperEmployerPercentage())
                .superMinimumSalary(dto.getSuperMinimumSalary() != null ? dto.getSuperMinimumSalary() : 0.0)
                .taxFreeThreshold(dto.getTaxFreeThreshold())
                .defaultResidentStatus(dto.getDefaultResidentStatus() != null ? dto.getDefaultResidentStatus() : true)
                .currencyCode(dto.getCurrencyCode() != null ? dto.getCurrencyCode() : "PGK")
                .fortnightsPerYear(dto.getFortnightsPerYear() != null ? dto.getFortnightsPerYear() : 26)
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .description(dto.getDescription())
                .build();

        TaxConfiguration saved = taxConfigRepository.save(config);
        
        // Initialize default slabs if requested
        if (dto.getTaxSlabs() == null || dto.getTaxSlabs().isEmpty()) {
            taxService.initializeDefaultTaxSlabs(saved);
        } else {
            // Save provided slabs
            for (TaxSlabDTO slabDto : dto.getTaxSlabs()) {
                TaxSlab slab = mapSlabFromDTO(slabDto, saved);
                taxSlabRepository.save(slab);
            }
        }

        log.info("Created tax configuration for year: {}", dto.getFinancialYear());
        return ResponseEntity.ok(ApiResponse.success("Tax configuration created", mapToDTO(saved)));
    }

    @PutMapping("/configurations/{id}")
    public ResponseEntity<ApiResponse<TaxConfigurationDTO>> updateConfiguration(
            @PathVariable Long id,
            @RequestBody TaxConfigurationDTO dto) {
        
        TaxConfiguration config = taxConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax configuration not found"));

        config.setFinancialYear(dto.getFinancialYear());
        config.setStartDate(dto.getStartDate());
        config.setEndDate(dto.getEndDate());
        config.setSuperEmployeePercentage(dto.getSuperEmployeePercentage());
        config.setSuperEmployerPercentage(dto.getSuperEmployerPercentage());
        config.setSuperMinimumSalary(dto.getSuperMinimumSalary());
        config.setTaxFreeThreshold(dto.getTaxFreeThreshold());
        config.setDefaultResidentStatus(dto.getDefaultResidentStatus());
        config.setCurrencyCode(dto.getCurrencyCode());
        config.setFortnightsPerYear(dto.getFortnightsPerYear());
        config.setIsActive(dto.getIsActive());
        config.setDescription(dto.getDescription());

        TaxConfiguration saved = taxConfigRepository.save(config);
        log.info("Updated tax configuration: {}", id);
        
        return ResponseEntity.ok(ApiResponse.success("Tax configuration updated", mapToDTO(saved)));
    }

    @DeleteMapping("/configurations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConfiguration(@PathVariable Long id) {
        TaxConfiguration config = taxConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax configuration not found"));
        
        taxConfigRepository.delete(config);
        log.info("Deleted tax configuration: {}", id);
        
        return ResponseEntity.ok(ApiResponse.success("Tax configuration deleted", null));
    }

    // ============ TAX SLAB ENDPOINTS ============

    @GetMapping("/configurations/{configId}/slabs")
    public ResponseEntity<ApiResponse<List<TaxSlabDTO>>> getSlabs(@PathVariable Long configId) {
        List<TaxSlabDTO> slabs = taxSlabRepository.findByTaxConfigurationIdOrderBySlabOrderAsc(configId)
                .stream()
                .map(this::mapSlabToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(slabs));
    }

    @PostMapping("/configurations/{configId}/slabs")
    public ResponseEntity<ApiResponse<TaxSlabDTO>> addSlab(
            @PathVariable Long configId,
            @RequestBody TaxSlabDTO dto) {
        
        TaxConfiguration config = taxConfigRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Tax configuration not found"));

        TaxSlab slab = mapSlabFromDTO(dto, config);
        TaxSlab saved = taxSlabRepository.save(slab);
        
        log.info("Added tax slab to configuration {}: {} - {}", configId, dto.getIncomeFrom(), dto.getIncomeTo());
        return ResponseEntity.ok(ApiResponse.success("Tax slab added", mapSlabToDTO(saved)));
    }

    @PutMapping("/slabs/{slabId}")
    public ResponseEntity<ApiResponse<TaxSlabDTO>> updateSlab(
            @PathVariable Long slabId,
            @RequestBody TaxSlabDTO dto) {
        
        TaxSlab slab = taxSlabRepository.findById(slabId)
                .orElseThrow(() -> new RuntimeException("Tax slab not found"));

        slab.setIncomeFrom(dto.getIncomeFrom());
        slab.setIncomeTo(dto.getIncomeTo());
        slab.setTaxRate(dto.getTaxRate());
        slab.setSlabOrder(dto.getSlabOrder());
        slab.setIsResident(dto.getIsResident());
        slab.setDescription(dto.getDescription());

        TaxSlab saved = taxSlabRepository.save(slab);
        log.info("Updated tax slab: {}", slabId);
        
        return ResponseEntity.ok(ApiResponse.success("Tax slab updated", mapSlabToDTO(saved)));
    }

    @DeleteMapping("/slabs/{slabId}")
    public ResponseEntity<ApiResponse<Void>> deleteSlab(@PathVariable Long slabId) {
        TaxSlab slab = taxSlabRepository.findById(slabId)
                .orElseThrow(() -> new RuntimeException("Tax slab not found"));
        
        taxSlabRepository.delete(slab);
        log.info("Deleted tax slab: {}", slabId);
        
        return ResponseEntity.ok(ApiResponse.success("Tax slab deleted", null));
    }

    @PostMapping("/configurations/{configId}/slabs/initialize-defaults")
    public ResponseEntity<ApiResponse<List<TaxSlabDTO>>> initializeDefaultSlabs(@PathVariable Long configId) {
        TaxConfiguration config = taxConfigRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Tax configuration not found"));

        // Delete existing slabs
        List<TaxSlab> existingSlabs = taxSlabRepository.findByTaxConfigurationIdOrderBySlabOrderAsc(configId);
        taxSlabRepository.deleteAll(existingSlabs);

        // Initialize default PNG slabs
        taxService.initializeDefaultTaxSlabs(config);

        // Return updated slabs
        List<TaxSlabDTO> slabs = taxSlabRepository.findByTaxConfigurationIdOrderBySlabOrderAsc(configId)
                .stream()
                .map(this::mapSlabToDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Default PNG tax slabs initialized", slabs));
    }

    // ============ MAPPING METHODS ============

    private TaxConfigurationDTO mapToDTO(TaxConfiguration config) {
        List<TaxSlabDTO> slabs = taxSlabRepository.findByTaxConfigurationIdOrderBySlabOrderAsc(config.getId())
                .stream()
                .map(this::mapSlabToDTO)
                .collect(Collectors.toList());

        return TaxConfigurationDTO.builder()
                .id(config.getId())
                .financialYear(config.getFinancialYear())
                .startDate(config.getStartDate())
                .endDate(config.getEndDate())
                .superEmployeePercentage(config.getSuperEmployeePercentage())
                .superEmployerPercentage(config.getSuperEmployerPercentage())
                .superMinimumSalary(config.getSuperMinimumSalary())
                .taxFreeThreshold(config.getTaxFreeThreshold())
                .defaultResidentStatus(config.getDefaultResidentStatus())
                .currencyCode(config.getCurrencyCode())
                .fortnightsPerYear(config.getFortnightsPerYear())
                .isActive(config.getIsActive())
                .description(config.getDescription())
                .taxSlabs(slabs)
                .build();
    }

    private TaxSlabDTO mapSlabToDTO(TaxSlab slab) {
        return TaxSlabDTO.builder()
                .id(slab.getId())
                .taxConfigurationId(slab.getTaxConfiguration().getId())
                .incomeFrom(slab.getIncomeFrom())
                .incomeTo(slab.getIncomeTo())
                .taxRate(slab.getTaxRate())
                .slabOrder(slab.getSlabOrder())
                .isResident(slab.getIsResident())
                .description(slab.getDescription())
                .build();
    }

    private TaxSlab mapSlabFromDTO(TaxSlabDTO dto, TaxConfiguration config) {
        return TaxSlab.builder()
                .taxConfiguration(config)
                .incomeFrom(dto.getIncomeFrom())
                .incomeTo(dto.getIncomeTo())
                .taxRate(dto.getTaxRate())
                .slabOrder(dto.getSlabOrder() != null ? dto.getSlabOrder() : 0)
                .isResident(dto.getIsResident() != null ? dto.getIsResident() : true)
                .description(dto.getDescription())
                .build();
    }
}
