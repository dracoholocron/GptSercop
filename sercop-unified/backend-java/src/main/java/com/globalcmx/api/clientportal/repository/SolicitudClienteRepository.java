package com.globalcmx.api.clientportal.repository;

import com.globalcmx.api.clientportal.entity.SolicitudCliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SolicitudCliente entity operations.
 */
@Repository
public interface SolicitudClienteRepository extends JpaRepository<SolicitudCliente, String> {

    // Find by request number
    Optional<SolicitudCliente> findByRequestNumber(String requestNumber);

    // Find all by cliente (with data isolation)
    Page<SolicitudCliente> findByClienteId(String clienteId, Pageable pageable);

    // Find by cliente and status
    Page<SolicitudCliente> findByClienteIdAndEstado(String clienteId, String estado, Pageable pageable);

    // Find by cliente and product type
    Page<SolicitudCliente> findByClienteIdAndProductoType(String clienteId, String productoType, Pageable pageable);

    // Find drafts for a client
    List<SolicitudCliente> findByClienteIdAndEstadoOrderByFechaCreacionDesc(String clienteId, String estado);

    // Count by cliente and status
    long countByClienteIdAndEstado(String clienteId, String estado);

    // Count by cliente (all statuses)
    long countByClienteId(String clienteId);

    // Find by assigned user
    Page<SolicitudCliente> findByAssignedToUserId(String assignedToUserId, Pageable pageable);

    // Find pending requests (for backoffice)
    @Query("SELECT s FROM SolicitudCliente s WHERE s.estado IN :statuses ORDER BY s.fechaEnvio ASC")
    Page<SolicitudCliente> findByEstadoIn(@Param("statuses") List<String> statuses, Pageable pageable);

    // Find requests with SLA at risk
    @Query("SELECT s FROM SolicitudCliente s WHERE s.slaDeadline IS NOT NULL AND s.slaDeadline < :deadline AND s.estado IN ('SUBMITTED', 'IN_REVIEW') ORDER BY s.slaDeadline ASC")
    List<SolicitudCliente> findSlaCritical(@Param("deadline") LocalDateTime deadline);

    // Find requests with breached SLA
    @Query("SELECT s FROM SolicitudCliente s WHERE (s.slaBreached = true OR (s.slaDeadline IS NOT NULL AND s.slaDeadline < CURRENT_TIMESTAMP)) AND s.estado IN ('SUBMITTED', 'IN_REVIEW') ORDER BY s.slaDeadline ASC")
    List<SolicitudCliente> findSlaBreached();

    // Statistics queries for dashboard
    @Query("SELECT COUNT(s) FROM SolicitudCliente s WHERE s.clienteId = :clienteId AND s.estado = :estado")
    long countByClienteIdAndEstadoForStats(@Param("clienteId") String clienteId, @Param("estado") String estado);

    @Query("SELECT SUM(s.monto) FROM SolicitudCliente s WHERE s.clienteId = :clienteId AND s.estado = 'APPROVED' AND s.moneda = :currency")
    java.math.BigDecimal sumApprovedAmountByClienteAndCurrency(@Param("clienteId") String clienteId, @Param("currency") String currency);

    // Search with multiple criteria
    @Query("SELECT s FROM SolicitudCliente s WHERE " +
           "s.clienteId = :clienteId AND " +
           "(:productoType IS NULL OR s.productoType = :productoType) AND " +
           "(:estado IS NULL OR s.estado = :estado) AND " +
           "(:searchTerm IS NULL OR s.requestNumber LIKE %:searchTerm% OR s.clienteName LIKE %:searchTerm%)")
    Page<SolicitudCliente> searchByCliente(
            @Param("clienteId") String clienteId,
            @Param("productoType") String productoType,
            @Param("estado") String estado,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Backoffice search (all clients)
    @Query("SELECT s FROM SolicitudCliente s WHERE " +
           "(:clienteId IS NULL OR s.clienteId = :clienteId) AND " +
           "(:productoType IS NULL OR s.productoType = :productoType) AND " +
           "(:estado IS NULL OR s.estado = :estado) AND " +
           "(:assignedToUserId IS NULL OR s.assignedToUserId = :assignedToUserId) AND " +
           "(:searchTerm IS NULL OR s.requestNumber LIKE %:searchTerm% OR s.clienteName LIKE %:searchTerm%)")
    Page<SolicitudCliente> searchAll(
            @Param("clienteId") String clienteId,
            @Param("productoType") String productoType,
            @Param("estado") String estado,
            @Param("assignedToUserId") String assignedToUserId,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // Backoffice statistics
    @Query("SELECT COUNT(s) FROM SolicitudCliente s WHERE s.estado = :estado")
    long countByEstadoForStats(@Param("estado") String estado);

    @Query("SELECT COUNT(s) FROM SolicitudCliente s WHERE s.assignedToUserId = :userId AND s.estado IN ('SUBMITTED', 'IN_REVIEW', 'PENDING_DOCUMENTS')")
    long countActiveByAssignedUser(@Param("userId") String userId);

    @Query("SELECT COUNT(s) FROM SolicitudCliente s WHERE s.slaDeadline IS NOT NULL AND s.slaDeadline < :threshold AND s.estado IN ('SUBMITTED', 'IN_REVIEW')")
    long countSlaAtRisk(@Param("threshold") LocalDateTime threshold);

    @Query("SELECT COUNT(s) FROM SolicitudCliente s WHERE (s.slaBreached = true OR (s.slaDeadline IS NOT NULL AND s.slaDeadline < CURRENT_TIMESTAMP)) AND s.estado IN ('SUBMITTED', 'IN_REVIEW')")
    long countSlaBreached();
}
