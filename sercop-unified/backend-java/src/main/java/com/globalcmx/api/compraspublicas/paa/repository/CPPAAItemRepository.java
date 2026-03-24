package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface CPPAAItemRepository extends JpaRepository<CPPAAItem, String> {

    List<CPPAAItem> findByPaaIdOrderByLineNumberAsc(String paaId);

    List<CPPAAItem> findByPaaIdAndStatusOrderByLineNumberAsc(String paaId, String status);

    List<CPPAAItem> findByCpcCodeOrderByPaaIdAsc(String cpcCode);

    @Query("SELECT i.cpcCode as cpcCode, i.cpcDescription as description, COUNT(i) as itemCount, SUM(i.budgetAmount) as totalBudget, COUNT(DISTINCT i.department) as deptCount " +
           "FROM CPPAAItem i WHERE i.paa.id = :paaId GROUP BY i.cpcCode, i.cpcDescription HAVING COUNT(DISTINCT i.department) > 1 ORDER BY totalBudget DESC")
    List<Map<String, Object>> findDemandAggregation(@Param("paaId") String paaId);

    @Query("SELECT i.department as department, COUNT(i) as itemCount, SUM(i.budgetAmount) as totalBudget " +
           "FROM CPPAAItem i WHERE i.paa.id = :paaId GROUP BY i.department ORDER BY totalBudget DESC")
    List<Map<String, Object>> findBudgetByDepartment(@Param("paaId") String paaId);
}
