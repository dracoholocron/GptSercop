package com.globalcmx.api.compraspublicas.market.service;

import com.globalcmx.api.compraspublicas.ai.repository.CPHistoricalPriceRepository;
import com.globalcmx.api.compraspublicas.market.entity.CPInflationIndex;
import com.globalcmx.api.compraspublicas.market.entity.CPRFI;
import com.globalcmx.api.compraspublicas.market.entity.CPRFIResponse;
import com.globalcmx.api.compraspublicas.market.repository.CPInflationIndexRepository;
import com.globalcmx.api.compraspublicas.market.repository.CPRFIRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPMarketAnalysisService {

    private final CPInflationIndexRepository inflationIndexRepository;
    private final CPRFIRepository rfiRepository;
    private final CPHistoricalPriceRepository historicalPriceRepository;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public BigDecimal getInflationAdjustedPrice(BigDecimal originalPrice, String originalMonth,
                                                 String targetMonth, String countryCode) {
        log.info("Calculating inflation-adjusted price: original={}, from={}, to={}, country={}",
                originalPrice, originalMonth, targetMonth, countryCode);

        CPInflationIndex originalIndex = inflationIndexRepository
                .findByCountryCodeAndYearMonth(countryCode, originalMonth)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Inflation index not found for: " + countryCode + "/" + originalMonth));

        CPInflationIndex targetIndex = inflationIndexRepository
                .findByCountryCodeAndYearMonth(countryCode, targetMonth)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Inflation index not found for: " + countryCode + "/" + targetMonth));

        // Adjusted price = originalPrice * (targetIndex / originalIndex)
        BigDecimal adjustmentFactor = targetIndex.getIndexValue()
                .divide(originalIndex.getIndexValue(), 6, RoundingMode.HALF_UP);

        return originalPrice.multiply(adjustmentFactor).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPInflationIndex> getInflationIndices(String countryCode) {
        return inflationIndexRepository.findByCountryCodeOrderByYearMonthDesc(countryCode);
    }

    @Transactional("readModelTransactionManager")
    public CPRFI createRFI(String processId, String title, String description,
                            String cpcCode, String userId) {
        log.info("Creating RFI: process={}, title={}, cpc={}", processId, title, cpcCode);

        CPRFI rfi = CPRFI.builder()
                .id(UUID.randomUUID().toString())
                .processId(processId)
                .title(title)
                .description(description)
                .cpcCode(cpcCode)
                .status("BORRADOR")
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return rfiRepository.save(rfi);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPRFI getRFI(String id) {
        return rfiRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("RFI not found: " + id));
    }

    @Transactional("readModelTransactionManager")
    public CPRFIResponse addRFIResponse(String rfiId, String supplierRuc, String supplierName,
                                         BigDecimal unitPrice, BigDecimal totalPrice,
                                         Integer deliveryDays, String observations) {
        log.info("Adding RFI response: rfi={}, supplier={}, unitPrice={}", rfiId, supplierRuc, unitPrice);

        CPRFI rfi = rfiRepository.findById(rfiId)
                .orElseThrow(() -> new IllegalArgumentException("RFI not found: " + rfiId));

        CPRFIResponse response = CPRFIResponse.builder()
                .id(UUID.randomUUID().toString())
                .rfi(rfi)
                .supplierRuc(supplierRuc)
                .supplierName(supplierName)
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .deliveryDays(deliveryDays)
                .observations(observations)
                .responseDate(LocalDate.now())
                .createdAt(LocalDateTime.now())
                .build();

        rfi.getResponses().add(response);
        rfiRepository.save(rfi);

        return response;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Map<String, Object> getRFIStatistics(String rfiId) {
        log.info("Calculating RFI statistics: rfi={}", rfiId);

        CPRFI rfi = rfiRepository.findById(rfiId)
                .orElseThrow(() -> new IllegalArgumentException("RFI not found: " + rfiId));

        Set<CPRFIResponse> responses = rfi.getResponses();
        Map<String, Object> stats = new HashMap<>();

        if (responses.isEmpty()) {
            stats.put("responseCount", 0);
            stats.put("avgUnitPrice", BigDecimal.ZERO);
            stats.put("minUnitPrice", BigDecimal.ZERO);
            stats.put("maxUnitPrice", BigDecimal.ZERO);
            stats.put("medianUnitPrice", BigDecimal.ZERO);
            return stats;
        }

        List<BigDecimal> unitPrices = responses.stream()
                .map(CPRFIResponse::getUnitPrice)
                .sorted()
                .collect(Collectors.toList());

        BigDecimal sum = unitPrices.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avg = sum.divide(BigDecimal.valueOf(unitPrices.size()), 4, RoundingMode.HALF_UP);

        BigDecimal min = unitPrices.get(0);
        BigDecimal max = unitPrices.get(unitPrices.size() - 1);

        // Calculate median
        BigDecimal median;
        int size = unitPrices.size();
        if (size % 2 == 0) {
            median = unitPrices.get(size / 2 - 1)
                    .add(unitPrices.get(size / 2))
                    .divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
        } else {
            median = unitPrices.get(size / 2);
        }

        stats.put("responseCount", unitPrices.size());
        stats.put("avgUnitPrice", avg);
        stats.put("minUnitPrice", min);
        stats.put("maxUnitPrice", max);
        stats.put("medianUnitPrice", median);

        return stats;
    }
}
