package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * General Ledger Entry - Read Model
 * Representa un asiento contable del libro mayor
 */
@Entity
@Table(name = "gle_read_model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GleReadModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inr", length = 20)
    private String inr;

    @Column(name = "objtyp", length = 10)
    private String objtyp;

    @Column(name = "objinr", length = 20)
    private String objinr;

    @Column(name = "trninr", length = 20)
    private String trninr;

    @Column(name = "act", length = 50)
    private String act;

    @Column(name = "dbtcdt", length = 1)
    private String dbtcdt;

    @Column(name = "cur", length = 3)
    private String cur;

    @Column(name = "amt", precision = 18, scale = 3)
    private BigDecimal amt;

    @Column(name = "syscur", length = 3)
    private String syscur;

    @Column(name = "sysamt", precision = 18, scale = 3)
    private BigDecimal sysamt;

    @Column(name = "valdat")
    private LocalDateTime valdat;

    @Column(name = "bucdat")
    private LocalDateTime bucdat;

    @Column(name = "txt1", length = 255)
    private String txt1;

    @Column(name = "txt2", length = 255)
    private String txt2;

    @Column(name = "txt3", length = 255)
    private String txt3;

    @Column(name = "prn", length = 50)
    private String prn;

    @Column(name = "expses", length = 50)
    private String expses;

    @Column(name = "tsyref", length = 50)
    private String tsyref;

    @Column(name = "expflg", length = 10)
    private String expflg;

    @Column(name = "acttyp", length = 10)
    private String acttyp;

    @Column(name = "referencia", length = 100)
    private String reference;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
