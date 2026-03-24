package com.globalcmx.api.metrics;

import io.micrometer.core.instrument.*;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Métricas de negocio para GlobalCMX
 * Expone métricas específicas del dominio de negocio para monitoreo en Grafana
 */
@Component
public class BusinessMetrics {

    private final MeterRegistry registry;

    // Contadores - Cartas de Crédito
    private final Counter letterOfCreditCreated;
    private final Counter letterOfCreditApproved;
    private final Counter letterOfCreditRejected;
    private final Counter letterOfCreditAmended;

    // Contadores - Mensajes SWIFT
    private final Counter swiftMessagesGenerated;

    // Contadores - Financiamientos
    private final Counter financingOperations;
    private final Counter documentaryCollections;

    // Gauges - Estado actual
    private final AtomicInteger pendingApprovals = new AtomicInteger(0);
    private final AtomicInteger operationsInProgress = new AtomicInteger(0);
    private final AtomicInteger activeUsers = new AtomicInteger(0);

    // Timers - Tiempos de procesamiento
    private final Timer letterOfCreditProcessingTime;
    private final Timer swiftGenerationTime;
    private final Timer approvalTime;

    // Distribution Summaries - Montos
    private final DistributionSummary transactionAmount;
    private final DistributionSummary creditLineAmount;

    public BusinessMetrics(MeterRegistry registry) {
        this.registry = registry;

        // === CONTADORES ===

        // Cartas de Crédito
        this.letterOfCreditCreated = Counter.builder("globalcmx.lc.created.total")
            .description("Total de cartas de crédito creadas")
            .register(registry);

        this.letterOfCreditApproved = Counter.builder("globalcmx.lc.approved.total")
            .description("Total de cartas de crédito aprobadas")
            .register(registry);

        this.letterOfCreditRejected = Counter.builder("globalcmx.lc.rejected.total")
            .description("Total de cartas de crédito rechazadas")
            .register(registry);

        this.letterOfCreditAmended = Counter.builder("globalcmx.lc.amended.total")
            .description("Total de enmiendas a cartas de crédito")
            .register(registry);

        // Mensajes SWIFT
        this.swiftMessagesGenerated = Counter.builder("globalcmx.swift.generated.total")
            .description("Total de mensajes SWIFT generados")
            .register(registry);

        // Financiamientos
        this.financingOperations = Counter.builder("globalcmx.financing.operations.total")
            .description("Total de operaciones de financiamiento")
            .register(registry);

        this.documentaryCollections = Counter.builder("globalcmx.documentary.collections.total")
            .description("Total de cobranzas documentarias")
            .register(registry);

        // === GAUGES ===

        Gauge.builder("globalcmx.approvals.pending", pendingApprovals, AtomicInteger::get)
            .description("Número de aprobaciones pendientes")
            .register(registry);

        Gauge.builder("globalcmx.operations.in_progress", operationsInProgress, AtomicInteger::get)
            .description("Número de operaciones en progreso")
            .register(registry);

        Gauge.builder("globalcmx.users.active", activeUsers, AtomicInteger::get)
            .description("Número de usuarios activos")
            .register(registry);

        // === TIMERS ===

        this.letterOfCreditProcessingTime = Timer.builder("globalcmx.lc.processing.time")
            .description("Tiempo de procesamiento de cartas de crédito")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry);

        this.swiftGenerationTime = Timer.builder("globalcmx.swift.generation.time")
            .description("Tiempo de generación de mensajes SWIFT")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry);

        this.approvalTime = Timer.builder("globalcmx.approval.time")
            .description("Tiempo desde creación hasta aprobación")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry);

        // === DISTRIBUTION SUMMARIES ===

        this.transactionAmount = DistributionSummary.builder("globalcmx.transaction.amount")
            .description("Monto de transacciones")
            .baseUnit("USD")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry);

        this.creditLineAmount = DistributionSummary.builder("globalcmx.credit.line.amount")
            .description("Monto de líneas de crédito")
            .baseUnit("USD")
            .publishPercentiles(0.5, 0.95, 0.99)
            .publishPercentileHistogram()
            .register(registry);
    }

    // ========================================
    // MÉTODOS PARA REGISTRAR EVENTOS
    // ========================================

    /**
     * Registra creación de carta de crédito
     */
    public void recordLetterOfCreditCreated(String type, String currency, String institution) {
        Counter.builder("globalcmx.lc.created.total")
            .tag("type", type)
            .tag("currency", currency)
            .tag("institution", institution)
            .register(registry)
            .increment();
    }

    /**
     * Registra aprobación de carta de crédito
     */
    public void recordLetterOfCreditApproved(String type, String institution) {
        letterOfCreditApproved.increment();

        Counter.builder("globalcmx.lc.approved.total")
            .tag("type", type)
            .tag("institution", institution)
            .register(registry)
            .increment();
    }

    /**
     * Registra rechazo de carta de crédito
     */
    public void recordLetterOfCreditRejected(String reason, String type) {
        letterOfCreditRejected.increment();

        Counter.builder("globalcmx.lc.rejected.total")
            .tag("reason", reason)
            .tag("type", type)
            .register(registry)
            .increment();
    }

    /**
     * Registra enmienda a carta de crédito
     */
    public void recordLetterOfCreditAmended(String amendmentType) {
        letterOfCreditAmended.increment();

        Counter.builder("globalcmx.lc.amended.total")
            .tag("amendment_type", amendmentType)
            .register(registry)
            .increment();
    }

    /**
     * Registra generación de mensaje SWIFT
     */
    public void recordSwiftMessageGenerated(String messageType, String direction) {
        swiftMessagesGenerated.increment();

        Counter.builder("globalcmx.swift.generated.total")
            .tag("type", messageType)
            .tag("direction", direction)
            .register(registry)
            .increment();
    }

    /**
     * Registra operación de financiamiento
     */
    public void recordFinancingOperation(String type, double amount, String currency) {
        financingOperations.increment();

        Counter.builder("globalcmx.financing.operations.total")
            .tag("type", type)
            .tag("currency", currency)
            .register(registry)
            .increment();

        transactionAmount.record(amount);
    }

    /**
     * Registra cobranza documentaria
     */
    public void recordDocumentaryCollection(String type, double amount) {
        documentaryCollections.increment();
        transactionAmount.record(amount);
    }

    /**
     * Registra monto de transacción
     */
    public void recordTransactionAmount(double amount, String currency) {
        DistributionSummary.builder("globalcmx.transaction.amount")
            .tag("currency", currency)
            .baseUnit(currency)
            .register(registry)
            .record(amount);
    }

    /**
     * Registra línea de crédito
     */
    public void recordCreditLineAmount(double amount, String institution) {
        creditLineAmount.record(amount);

        DistributionSummary.builder("globalcmx.credit.line.amount")
            .tag("institution", institution)
            .register(registry)
            .record(amount);
    }

    // ========================================
    // TIMERS
    // ========================================

    /**
     * Inicia temporizador para procesamiento de LC
     */
    public Timer.Sample startLetterOfCreditProcessing() {
        operationsInProgress.incrementAndGet();
        return Timer.start(registry);
    }

    /**
     * Finaliza temporizador de procesamiento de LC
     */
    public void endLetterOfCreditProcessing(Timer.Sample sample, boolean approved, String type) {
        operationsInProgress.decrementAndGet();
        sample.stop(letterOfCreditProcessingTime);

        if (approved) {
            recordLetterOfCreditApproved(type, "");
        }
    }

    /**
     * Inicia temporizador para generación SWIFT
     */
    public Timer.Sample startSwiftGeneration() {
        return Timer.start(registry);
    }

    /**
     * Finaliza temporizador de generación SWIFT
     */
    public void endSwiftGeneration(Timer.Sample sample, String messageType) {
        sample.stop(swiftGenerationTime);
    }

    /**
     * Registra tiempo de aprobación
     */
    public void recordApprovalTime(long durationMillis) {
        approvalTime.record(durationMillis, java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    // ========================================
    // GAUGES
    // ========================================

    /**
     * Actualiza contador de aprobaciones pendientes
     */
    public void updatePendingApprovals(int count) {
        pendingApprovals.set(count);
    }

    /**
     * Incrementa operaciones en progreso
     */
    public void incrementOperationsInProgress() {
        operationsInProgress.incrementAndGet();
    }

    /**
     * Decrementa operaciones en progreso
     */
    public void decrementOperationsInProgress() {
        operationsInProgress.decrementAndGet();
    }

    /**
     * Actualiza usuarios activos
     */
    public void updateActiveUsers(int count) {
        activeUsers.set(count);
    }

    /**
     * Registra login de usuario
     */
    public void recordUserLogin(String username, String role) {
        Counter.builder("globalcmx.user.login.total")
            .tag("role", role)
            .register(registry)
            .increment();
    }

    /**
     * Registra operación por institución
     */
    public void recordOperationByInstitution(String institution, String operationType) {
        Counter.builder("globalcmx.operations.by.institution")
            .tag("institution", institution)
            .tag("type", operationType)
            .register(registry)
            .increment();
    }
}
