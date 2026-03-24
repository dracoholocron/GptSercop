package com.globalcmx.api.compraspublicas.market.repository;

import com.globalcmx.api.compraspublicas.market.entity.CPRFI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPRFIRepository extends JpaRepository<CPRFI, String> {

    List<CPRFI> findByProcessIdOrderByCreatedAtDesc(String processId);

    List<CPRFI> findByCpcCodeAndStatusOrderByCreatedAtDesc(String cpcCode, String status);

    List<CPRFI> findByStatusOrderByClosingDateAsc(String status);
}
