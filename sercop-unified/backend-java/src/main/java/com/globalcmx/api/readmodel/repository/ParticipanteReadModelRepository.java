package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipanteReadModelRepository extends JpaRepository<ParticipanteReadModel, Long>, JpaSpecificationExecutor<ParticipanteReadModel> {
    Optional<ParticipanteReadModel> findByIdentificacion(String identificacion);
    Optional<ParticipanteReadModel> findByIdentificacionAndTipoReferencia(String identificacion, String tipoReferencia);
    List<ParticipanteReadModel> findByTipo(String tipo);
    Optional<ParticipanteReadModel> findByEmail(String email);
    List<ParticipanteReadModel> findByAgencia(String agencia);
    List<ParticipanteReadModel> findByEjecutivoAsignado(String ejecutivoAsignado);

    @Query("SELECT p FROM ParticipanteReadModel p WHERE " +
           "(:identificacion IS NULL OR LOWER(p.identificacion) LIKE LOWER(CONCAT('%', :identificacion, '%'))) AND " +
           "(:tipo IS NULL OR p.tipo = :tipo) AND " +
           "(:nombres IS NULL OR LOWER(p.nombres) LIKE LOWER(CONCAT('%', :nombres, '%'))) AND " +
           "(:apellidos IS NULL OR LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :apellidos, '%'))) AND " +
           "(:email IS NULL OR LOWER(p.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:agencia IS NULL OR LOWER(p.agencia) LIKE LOWER(CONCAT('%', :agencia, '%'))) AND " +
           "(:autenticador IS NULL OR p.autenticador = :autenticador)")
    Page<ParticipanteReadModel> findAllWithFilters(
        @Param("identificacion") String identificacion,
        @Param("tipo") String tipo,
        @Param("nombres") String nombres,
        @Param("apellidos") String apellidos,
        @Param("email") String email,
        @Param("agencia") String agencia,
        @Param("autenticador") String autenticador,
        Pageable pageable
    );

    /**
     * Search participants by a term across multiple fields using OR logic.
     * Searches in: identificacion, nombres, apellidos, email
     * Excludes participants of type "No cliente"
     */
    @Query("SELECT p FROM ParticipanteReadModel p WHERE " +
           "p.tipo != 'No cliente' AND (" +
           "LOWER(p.identificacion) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.nombres) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.apellidos) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<ParticipanteReadModel> searchByTerm(
        @Param("searchTerm") String searchTerm,
        Pageable pageable
    );

    // ==========================================
    // Hierarchy queries (Corporation support)
    // ==========================================

    /**
     * Find direct children of a participant (one level down)
     */
    List<ParticipanteReadModel> findByParentId(Long parentId);

    /**
     * Find direct children of a participant ordered by name
     */
    List<ParticipanteReadModel> findByParentIdOrderByNombresAsc(Long parentId);

    /**
     * Find all corporations (participants without parent and type CORPORATION)
     */
    @Query("SELECT p FROM ParticipanteReadModel p WHERE p.parentId IS NULL AND p.hierarchyType = 'CORPORATION'")
    List<ParticipanteReadModel> findAllCorporations();

    /**
     * Find all root participants (no parent) of any type
     */
    List<ParticipanteReadModel> findByParentIdIsNull();

    /**
     * Find participants by hierarchy type
     */
    List<ParticipanteReadModel> findByHierarchyType(String hierarchyType);

    /**
     * Check if a participant has children
     */
    @Query("SELECT COUNT(p) > 0 FROM ParticipanteReadModel p WHERE p.parentId = :parentId")
    boolean hasChildren(@Param("parentId") Long parentId);

    /**
     * Count children of a participant
     */
    @Query("SELECT COUNT(p) FROM ParticipanteReadModel p WHERE p.parentId = :parentId")
    long countChildren(@Param("parentId") Long parentId);

    /**
     * Get all descendant IDs (recursive) using native query with CTE
     * Returns the root ID plus all descendant IDs
     */
    @Query(nativeQuery = true, value =
        "WITH RECURSIVE descendants AS (" +
        "  SELECT id FROM participant_read_model WHERE id = :rootId " +
        "  UNION ALL " +
        "  SELECT p.id FROM participant_read_model p " +
        "  INNER JOIN descendants d ON p.parent_id = d.id" +
        ") SELECT id FROM descendants")
    List<Long> findAllDescendantIds(@Param("rootId") Long rootId);

    /**
     * Get all descendants as entities (recursive)
     */
    @Query(nativeQuery = true, value =
        "WITH RECURSIVE descendants AS (" +
        "  SELECT * FROM participant_read_model WHERE id = :rootId " +
        "  UNION ALL " +
        "  SELECT p.* FROM participant_read_model p " +
        "  INNER JOIN descendants d ON p.parent_id = d.id" +
        ") SELECT * FROM descendants ORDER BY hierarchy_level, first_names")
    List<ParticipanteReadModel> findAllDescendants(@Param("rootId") Long rootId);

    /**
     * Get the root corporation for any participant (traverse up)
     */
    @Query(nativeQuery = true, value =
        "WITH RECURSIVE ancestors AS (" +
        "  SELECT * FROM participant_read_model WHERE id = :participantId " +
        "  UNION ALL " +
        "  SELECT p.* FROM participant_read_model p " +
        "  INNER JOIN ancestors a ON p.id = a.parent_id" +
        ") SELECT * FROM ancestors WHERE parent_id IS NULL LIMIT 1")
    Optional<ParticipanteReadModel> findRootAncestor(@Param("participantId") Long participantId);

    /**
     * Get the path from root to a participant (for breadcrumb)
     */
    @Query(nativeQuery = true, value =
        "WITH RECURSIVE ancestors AS (" +
        "  SELECT *, 0 as depth FROM participant_read_model WHERE id = :participantId " +
        "  UNION ALL " +
        "  SELECT p.*, a.depth + 1 FROM participant_read_model p " +
        "  INNER JOIN ancestors a ON p.id = a.parent_id" +
        ") SELECT * FROM ancestors ORDER BY depth DESC")
    List<ParticipanteReadModel> findAncestorPath(@Param("participantId") Long participantId);

    /**
     * Check if participantId is a descendant of ancestorId
     */
    @Query(nativeQuery = true, value =
        "WITH RECURSIVE descendants AS (" +
        "  SELECT id FROM participant_read_model WHERE id = :ancestorId " +
        "  UNION ALL " +
        "  SELECT p.id FROM participant_read_model p " +
        "  INNER JOIN descendants d ON p.parent_id = d.id" +
        ") SELECT COUNT(*) > 0 FROM descendants WHERE id = :participantId")
    boolean isDescendantOf(@Param("participantId") Long participantId, @Param("ancestorId") Long ancestorId);
}
