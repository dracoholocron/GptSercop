package com.globalcmx.api.config;

import com.globalcmx.api.model.cx.*;
import com.globalcmx.api.model.cx.enums.*;
import com.globalcmx.api.repository.cx.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@Profile("!prod")
@RequiredArgsConstructor
@Slf4j
@Order(100)
public class CxTestDataInitializer implements CommandLineRunner {

    private final FinancialInstitutionRepository institucionRepository;
    private final LetterOfCreditRepository cartaCreditoRepository;
    private final DocumentaryCollectionRepository cobranzaRepository;
    private final BankGuaranteeRepository garantiaRepository;
    private final FinanciamientoCxRepository financiamientoRepository;
    // private final LineaCreditoRepository lineaCreditoRepository; // Removed - using LineaCreditoReadModel instead

    @Override
    public void run(String... args) {
        log.info("=".repeat(80));
        log.info("Inicializando datos de prueba para Comercio Exterior...");
        log.info("=".repeat(80));

        try {
            // Verificar si ya existen datos
            if (institucionRepository.count() > 0) {
                log.info("Ya existen instituciones financieras. Omitiendo inicialización.");
                return;
            }

            crearInstitucionesFinancieras();
            // crearLineasCredito(); // Removed - using LineaCreditoReadModel instead
            crearCartasCredito();
            crearCobranzasDocumentarias();
            crearGarantiasBancarias();
            crearFinanciamientos();

            log.info("=".repeat(80));
            log.info("Datos de prueba de Comercio Exterior inicializados correctamente");
            log.info("=".repeat(80));

        } catch (Exception e) {
            log.error("Error al inicializar datos de prueba de CX", e);
        }
    }

    private void crearInstitucionesFinancieras() {
        log.info("Creando instituciones financieras...");

        FinancialInstitution bbva = FinancialInstitution.builder()
                .codigo("BBVA-MX")
                .nombre("BBVA México")
                .swiftCode("BCMRMXMM")
                .pais("MEX")
                .ciudad("Ciudad de México")
                .direccion("Paseo de la Reforma 510")
                .tipo(FinancialInstitution.TipoInstitucion.BANCO_COMERCIAL)
                .rating("AA-")
                .esCorresponsal(true)
                .activo(true)
                .build();

        FinancialInstitution santander = FinancialInstitution.builder()
                .codigo("SANT-MX")
                .nombre("Santander México")
                .swiftCode("BMSXMXMM")
                .pais("MEX")
                .ciudad("Ciudad de México")
                .direccion("Prolongación Paseo de la Reforma 500")
                .tipo(FinancialInstitution.TipoInstitucion.BANCO_COMERCIAL)
                .rating("A+")
                .esCorresponsal(true)
                .activo(true)
                .build();

        FinancialInstitution citibank = FinancialInstitution.builder()
                .codigo("CITI-US")
                .nombre("Citibank N.A.")
                .swiftCode("CITIUS33")
                .pais("USA")
                .ciudad("New York")
                .direccion("399 Park Avenue")
                .tipo(FinancialInstitution.TipoInstitucion.BANCO_COMERCIAL)
                .rating("AA")
                .esCorresponsal(true)
                .activo(true)
                .build();

        FinancialInstitution hsbc = FinancialInstitution.builder()
                .codigo("HSBC-MX")
                .nombre("HSBC México")
                .swiftCode("BIMEMXMM")
                .pais("MEX")
                .ciudad("Ciudad de México")
                .direccion("Paseo de la Reforma 347")
                .tipo(FinancialInstitution.TipoInstitucion.BANCO_COMERCIAL)
                .rating("A")
                .esCorresponsal(true)
                .activo(true)
                .build();

        FinancialInstitution banorte = FinancialInstitution.builder()
                .codigo("BANORTE")
                .nombre("Banco del Noreste")
                .swiftCode("MENOMXMT")
                .pais("MEX")
                .ciudad("Monterrey")
                .direccion("Av. Roberto Garza Sada 2444")
                .tipo(FinancialInstitution.TipoInstitucion.BANCO_COMERCIAL)
                .rating("A+")
                .esCorresponsal(false)
                .activo(true)
                .build();

        institucionRepository.save(bbva);
        institucionRepository.save(santander);
        institucionRepository.save(citibank);
        institucionRepository.save(hsbc);
        institucionRepository.save(banorte);

        log.info("✓ Creadas 5 instituciones financieras");
    }

    // Removed - using LineaCreditoReadModel instead
    /*
    private void crearLineasCredito() {
        log.info("Creando líneas de crédito...");

        LineaCredito linea1 = LineaCredito.builder()
                .clienteId(1L)
                .tipo("CARTAS_CREDITO")
                .moneda("USD")
                .montoAutorizado(new BigDecimal("1000000.00"))
                .montoUtilizado(BigDecimal.ZERO)
                .montoDisponible(new BigDecimal("1000000.00"))
                .fechaAutorizacion(LocalDate.now().minusMonths(6))
                .fechaVencimiento(LocalDate.now().plusMonths(18))
                .tasaReferencia("LIBOR")
                .spread(new BigDecimal("2.5"))
                .estado("VIGENTE")
                .build();

        LineaCredito linea2 = LineaCredito.builder()
                .clienteId(2L)
                .tipo("GENERAL_CX")
                .moneda("USD")
                .montoAutorizado(new BigDecimal("500000.00"))
                .montoUtilizado(BigDecimal.ZERO)
                .montoDisponible(new BigDecimal("500000.00"))
                .fechaAutorizacion(LocalDate.now().minusMonths(3))
                .fechaVencimiento(LocalDate.now().plusYears(1))
                .tasaReferencia("LIBOR")
                .spread(new BigDecimal("3.0"))
                .estado("VIGENTE")
                .build();

        lineaCreditoRepository.save(linea1);
        lineaCreditoRepository.save(linea2);

        log.info("✓ Creadas 2 líneas de crédito");
    }
    */

    private void crearCartasCredito() {
        log.info("Creando cartas de crédito...");

        FinancialInstitution bbva = institucionRepository.findByCodigo("BBVA-MX").orElseThrow();
        FinancialInstitution citibank = institucionRepository.findByCodigo("CITI-US").orElseThrow();
        FinancialInstitution santander = institucionRepository.findByCodigo("SANT-MX").orElseThrow();

        LetterOfCredit lc1 = LetterOfCredit.builder()
                .numeroOperacion("LC-2025-001")
                .tipoLc(TipoLC.IMPORTACION)
                .modalidad(ModalidadLC.IRREVOCABLE)
                .formaPago(FormaPagoLC.A_LA_VISTA)
                .estado(EstadoLC.EMITIDA)
                .ordenanteId(1L)
                .beneficiarioId(100L)
                .bancoEmisor(bbva)
                .bancoAvisador(citibank)
                .moneda("USD")
                .monto(new BigDecimal("250000.00"))
                .montoUtilizado(BigDecimal.ZERO)
                .porcentajeTolerancia(new BigDecimal("10.0"))
                .fechaEmision(LocalDate.now().minusDays(30))
                .fechaVencimiento(LocalDate.now().plusDays(150))
                .fechaUltimoEmbarque(LocalDate.now().plusDays(120))
                .lugarEmbarque("Shanghai, China")
                .lugarDestino("Veracruz, México")
                .requiereFacturaComercial(true)
                .requierePackingList(true)
                .requiereConocimientoEmbarque(true)
                .requiereCertificadoOrigen(true)
                .requiereCertificadoSeguro(true)
                .incoterm("FOB")
                .descripcionMercancia("Maquinaria industrial - Tornos CNC y accesorios")
                .condicionesEspeciales("Documentos deben presentarse dentro de 21 días después del embarque")
                .instruccionesEmbarque("Embarque parcial permitido. Transbordo prohibido.")
                .usuarioCreacion("admin")
                .build();

        LetterOfCredit lc2 = LetterOfCredit.builder()
                .numeroOperacion("LC-2025-002")
                .tipoLc(TipoLC.EXPORTACION)
                .modalidad(ModalidadLC.CONFIRMADA)
                .formaPago(FormaPagoLC.PAGO_DIFERIDO)
                .estado(EstadoLC.CONFIRMADA)
                .ordenanteId(200L)
                .beneficiarioId(2L)
                .bancoEmisor(citibank)
                .bancoAvisador(santander)
                .bancoConfirmador(bbva)
                .moneda("USD")
                .monto(new BigDecimal("180000.00"))
                .montoUtilizado(BigDecimal.ZERO)
                .porcentajeTolerancia(new BigDecimal("5.0"))
                .fechaEmision(LocalDate.now().minusDays(15))
                .fechaVencimiento(LocalDate.now().plusDays(180))
                .fechaUltimoEmbarque(LocalDate.now().plusDays(90))
                .lugarEmbarque("Manzanillo, México")
                .lugarDestino("Los Angeles, USA")
                .requiereFacturaComercial(true)
                .requierePackingList(true)
                .requiereConocimientoEmbarque(true)
                .requiereCertificadoOrigen(false)
                .requiereCertificadoSeguro(false)
                .incoterm("CIF")
                .descripcionMercancia("Aguacate Hass - 500 toneladas")
                .condicionesEspeciales("Pago a 90 días después de la presentación de documentos")
                .instruccionesEmbarque("Contenedores refrigerados requeridos. Embarque parcial no permitido.")
                .usuarioCreacion("admin")
                .build();

        cartaCreditoRepository.save(lc1);
        cartaCreditoRepository.save(lc2);

        log.info("✓ Creadas 2 cartas de crédito");
    }

    private void crearCobranzasDocumentarias() {
        log.info("Creando cobranzas documentarias...");

        FinancialInstitution santander = institucionRepository.findByCodigo("SANT-MX").orElseThrow();
        FinancialInstitution hsbc = institucionRepository.findByCodigo("HSBC-MX").orElseThrow();

        DocumentaryCollection cob1 = DocumentaryCollection.builder()
                .numeroOperacion("COB-2025-001")
                .tipo(TipoCobranza.IMPORTACION)
                .modalidad(ModalidadCobranza.D_P)
                .estado(EstadoCobranza.RECIBIDA)
                .libradorId(2L)
                .libradoId(201L)
                .bancoRemitente(santander)
                .bancoCobrador(hsbc)
                .moneda("USD")
                .monto(new BigDecimal("75000.00"))
                .fechaRecepcion(LocalDate.now().minusDays(10))
                .fechaVencimiento(LocalDate.now().plusDays(90))
                .conocimientoEmbarque(true)
                .facturaComercial(true)
                .certificadoOrigen(true)
                .instruccionesProtesto("Protestar en caso de impago")
                .instruccionesImpago("Contactar inmediatamente al librador")
                .observaciones("Mercancía en tránsito")
                .build();

        cobranzaRepository.save(cob1);

        log.info("✓ Creada 1 cobranza documentaria");
    }

    private void crearGarantiasBancarias() {
        log.info("Creando garantías bancarias...");

        FinancialInstitution bbva = institucionRepository.findByCodigo("BBVA-MX").orElseThrow();

        BankGuarantee gar1 = BankGuarantee.builder()
                .numeroGarantia("GB-2025-001")
                .tipo(TipoGarantia.BID_BOND)
                .subtipo(SubtipoGarantia.NACIONAL)
                .estado(EstadoGarantia.VIGENTE)
                .ordenanteId(1L)
                .beneficiarioId(300L)
                .bancoGarante(bbva)
                .moneda("MXN")
                .monto(new BigDecimal("5000000.00"))
                .porcentajeProyecto(new BigDecimal("30.0"))
                .fechaEmision(LocalDate.now().minusDays(20))
                .fechaVencimiento(LocalDate.now().plusMonths(12))
                .numeroContrato("CONT-2025-456")
                .objetoContrato("Construcción de planta industrial")
                .montoContrato(new BigDecimal("16666666.67"))
                .descripcion("Garantía de anticipo para proyecto de construcción")
                .esReducible(true)
                .formulaReduccion("Reducción proporcional al avance de obra certificado")
                .condicionesEjecucion("Se ejecutará en caso de incumplimiento del contrato principal")
                .condicionesLiberacion("Se libera al completarse el proyecto satisfactoriamente")
                .build();

        garantiaRepository.save(gar1);

        log.info("✓ Creada 1 garantía bancaria");
    }

    private void crearFinanciamientos() {
        log.info("Creando financiamientos...");

        FinanciamientoCx fin1 = FinanciamientoCx.builder()
                .numeroOperacion("FIN-2025-001")
                .tipo(TipoFinanciamiento.PREFINANCIAMIENTO_EXPORTACION)
                .operacionVinculadaTipo("CARTA_CREDITO")
                .operacionVinculadaId(2L)
                .clienteId(2L)
                .lineaCreditoId(2L)
                .moneda("USD")
                .montoSolicitado(new BigDecimal("150000.00"))
                .montoAprobado(new BigDecimal("150000.00"))
                .montoDesembolsado(new BigDecimal("150000.00"))
                .plazoDias(180)
                .tasaInteres(new BigDecimal("8.5"))
                .tasaMora(new BigDecimal("12.0"))
                .comisionApertura(new BigDecimal("1500.00"))
                .fechaDesembolso(LocalDate.now().minusDays(5))
                .fechaVencimiento(LocalDate.now().plusDays(175))
                .tipoGarantia("Carta de Crédito confirmada")
                .descripcionGarantia("Garantizado con LC-2025-002")
                .estado(EstadoFinanciamiento.VIGENTE)
                .build();

        financiamientoRepository.save(fin1);

        log.info("✓ Creado 1 financiamiento");
    }
}
