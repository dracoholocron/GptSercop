package com.globalcmx.api.service.comision;

import com.globalcmx.api.dto.comision.ComisionResponse;
import com.globalcmx.api.dto.comision.ConfiguracionComision;
import com.globalcmx.api.dto.swift.MensajeSWIFT;
import com.globalcmx.api.dto.command.SaveDroolsRulesCommand;
import com.globalcmx.api.readmodel.entity.DroolsRulesConfigReadModel;
import com.globalcmx.api.service.command.DroolsRulesConfigCommandService;
import com.globalcmx.api.service.query.DroolsRulesConfigQueryService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.io.ResourceType;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.internal.io.ResourceFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para calcular comisiones usando Drools Rules (DRL)
 */
@Slf4j
@Service
public class ComisionService {

    private final DroolsRulesConfigCommandService droolsRulesConfigCommandService;
    private final DroolsRulesConfigQueryService droolsRulesConfigQueryService;

    private KieContainer kieContainer;
    private static final String DRL_FILE = "comisiones-swift.drl";
    private static final String RULE_TYPE_COMMISSION = "COMMISSION";

    public ComisionService(DroolsRulesConfigCommandService droolsRulesConfigCommandService,
                           DroolsRulesConfigQueryService droolsRulesConfigQueryService) {
        this.droolsRulesConfigCommandService = droolsRulesConfigCommandService;
        this.droolsRulesConfigQueryService = droolsRulesConfigQueryService;
    }

    @PostConstruct
    public void init() {
        try {
            log.info("Inicializando Drools para comisiones...");

            // Intentar cargar DRL desde base de datos primero
            String drlContent = loadDrlFromDatabase();

            if (drlContent == null) {
                // Fallback: cargar desde classpath (primera vez o si no hay datos en DB)
                log.info("No se encontró DRL en base de datos, cargando desde classpath: {}", DRL_FILE);
                drlContent = loadDrlFromClasspath();
            }

            // Compilar el KieContainer con el DRL content
            buildKieContainer(drlContent);

            log.info("Drools inicializado correctamente para comisiones");
        } catch (Exception e) {
            log.error("Error al inicializar Drools", e);
            throw new RuntimeException("Error al inicializar Drools", e);
        }
    }

    /**
     * Carga DRL desde la base de datos
     * @return contenido DRL o null si no existe
     */
    private String loadDrlFromDatabase() {
        try {
            return droolsRulesConfigQueryService.getActiveByRuleType(RULE_TYPE_COMMISSION)
                    .map(config -> {
                        log.info("DRL de comisiones cargado desde base de datos. Version: {}, Size: {} chars",
                                config.getVersion(), config.getDrlContent().length());
                        return config.getDrlContent();
                    })
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Error al cargar DRL desde base de datos, se usará classpath: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Carga DRL desde classpath (fallback)
     */
    private String loadDrlFromClasspath() throws Exception {
        ClassPathResource resource = new ClassPathResource(DRL_FILE);
        try (InputStream inputStream = resource.getInputStream()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /**
     * Compila el KieContainer a partir del contenido DRL
     */
    private void buildKieContainer(String drlContent) {
        KieServices kieServices = KieServices.Factory.get();
        KieFileSystem kieFileSystem = kieServices.newKieFileSystem();

        // Agregar el contenido DRL al KieFileSystem
        kieFileSystem.write(
            ResourceFactory.newInputStreamResource(
                new ByteArrayInputStream(drlContent.getBytes(StandardCharsets.UTF_8))
            )
            .setResourceType(ResourceType.DRL)
            .setSourcePath("src/main/resources/" + DRL_FILE)
        );

        // Construir el KieContainer
        KieBuilder kieBuilder = kieServices.newKieBuilder(kieFileSystem);
        kieBuilder.buildAll();

        // Verificar errores
        if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
            log.error("Errores al construir Drools: {}", kieBuilder.getResults().getMessages());
            throw new RuntimeException("Error al cargar reglas de Drools: " +
                kieBuilder.getResults().getMessages());
        }

        kieContainer = kieServices.newKieContainer(
            kieServices.getRepository().getDefaultReleaseId()
        );
    }

    /**
     * Calcula la comisión para un mensaje SWIFT
     *
     * @param mensaje Mensaje SWIFT con los datos de la operación
     * @return Respuesta con la comisión calculada
     */
    public ComisionResponse calcularComision(MensajeSWIFT mensaje) {
        log.info("Calculando comisión para mensaje: {} - {} - {} {}",
            mensaje.getTipoMensaje(),
            mensaje.getEvento(),
            mensaje.getMonto(),
            mensaje.getMoneda());

        KieSession kieSession = null;
        try {
            // Crear nueva sesión
            kieSession = kieContainer.newKieSession();

            // Crear objeto de configuración
            ConfiguracionComision config = new ConfiguracionComision();

            // Insertar hechos en la sesión
            kieSession.insert(mensaje);
            kieSession.insert(config);

            // Ejecutar reglas
            int rulesFired = kieSession.fireAllRules();
            log.info("Reglas ejecutadas: {}", rulesFired);

            // Construir respuesta
            ComisionResponse response = ComisionResponse.builder()
                .mensaje(mensaje)
                .configuracion(config)
                .moneda(mensaje.getMoneda())
                .build();

            // Calcular comisión final
            response.calcularComisionFinal(mensaje.getMonto());

            log.info("Comisión calculada: {} {} - Regla aplicada: {}",
                response.getComisionCalculada(),
                response.getMoneda(),
                response.getReglaAplicada());

            return response;

        } catch (Exception e) {
            log.error("Error al calcular comisión", e);
            throw new RuntimeException("Error al calcular comisión: " + e.getMessage(), e);
        } finally {
            if (kieSession != null) {
                kieSession.dispose();
            }
        }
    }

    /**
     * Recarga las reglas desde la base de datos
     * Útil para actualizar comisiones sin reiniciar el servidor
     */
    public void recargarReglas() {
        log.info("Recargando reglas de comisiones desde base de datos...");
        init();
        log.info("Reglas recargadas exitosamente");
    }

    /**
     * Carga un archivo Excel y genera el archivo DRL correspondiente
     *
     * @param file Archivo Excel con la configuración de comisiones
     */
    @Transactional
    public void cargarExcelYGenerarDRL(MultipartFile file) throws Exception {
        log.info("Procesando archivo Excel: {}", file.getOriginalFilename());

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);

            // Validar estructura del Excel
            validarEstructuraExcel(sheet);

            // Leer los datos y generar el DRL
            List<ReglaComision> reglas = leerReglasDesdeExcel(sheet);

            log.info("Se encontraron {} reglas de comisión", reglas.size());

            // Generar el contenido DRL
            String drlContent = generarDRL(reglas);

            // Guardar el DRL en base de datos (incluyendo el Excel original)
            guardarDrlEnDatabase(drlContent, file.getOriginalFilename(), file.getBytes());

            log.info("Archivo DRL generado y guardado en base de datos exitosamente");

            // Aplicar las reglas directamente al KieContainer con el DRL recién generado.
            // NO usar recargarReglas() aquí porque la transacción aún no ha hecho commit
            // y loadDrlFromDatabase() leería el DRL anterior.
            log.info("Aplicando {} reglas directamente al motor Drools...", reglas.size());
            buildKieContainer(drlContent);
            log.info("Reglas aplicadas exitosamente al motor Drools");

        } catch (Exception e) {
            log.error("Error al procesar archivo Excel", e);
            throw new RuntimeException("Error al procesar archivo Excel: " + e.getMessage(), e);
        }
    }

    /**
     * Valida que el Excel tenga la estructura correcta
     */
    private void validarEstructuraExcel(Sheet sheet) {
        if (sheet.getPhysicalNumberOfRows() < 10) {
            throw new IllegalArgumentException("El archivo Excel no tiene la estructura correcta. Debe tener al menos 10 filas.");
        }

        // Validar que la fila 9 (índice 8) contenga los constraints esperados
        Row headerRow = sheet.getRow(8);
        if (headerRow == null) {
            throw new IllegalArgumentException("Falta la fila de definición de constraints (fila 9)");
        }

        // Validar que tenga al menos 11 columnas
        if (headerRow.getPhysicalNumberOfCells() < 11) {
            throw new IllegalArgumentException("El archivo debe tener al menos 11 columnas de configuración");
        }

        log.info("Estructura del Excel validada correctamente");
    }

    /**
     * Lee las reglas desde el Excel
     */
    private List<ReglaComision> leerReglasDesdeExcel(Sheet sheet) {
        List<ReglaComision> reglas = new ArrayList<>();

        // Las reglas comienzan en la fila 10 (índice 9)
        for (int i = 9; i < sheet.getPhysicalNumberOfRows(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            try {
                ReglaComision regla = new ReglaComision();
                regla.tipoMensaje = getCellValueAsString(row.getCell(0));
                regla.evento = getCellValueAsString(row.getCell(1));
                regla.montoMin = getCellValueAsDouble(row.getCell(2));
                regla.montoMax = getCellValueAsDouble(row.getCell(3));
                regla.moneda = getCellValueAsString(row.getCell(4));
                regla.paisOrigen = getCellValueAsString(row.getCell(5));
                regla.paisDestino = getCellValueAsString(row.getCell(6));
                regla.comisionFija = getCellValueAsDouble(row.getCell(7));
                regla.comisionPorcentaje = getCellValueAsDouble(row.getCell(8));
                regla.comisionMinima = getCellValueAsDouble(row.getCell(9));
                regla.comisionMaxima = getCellValueAsDouble(row.getCell(10));

                // Validar que al menos tenga tipo de mensaje
                if (regla.tipoMensaje != null && !regla.tipoMensaje.isEmpty()) {
                    reglas.add(regla);
                }
            } catch (Exception e) {
                log.warn("Error al leer fila {}: {}", i + 1, e.getMessage());
            }
        }

        return reglas;
    }

    /**
     * Obtiene el valor de una celda como String
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    /**
     * Obtiene el valor de una celda como Double
     */
    private Double getCellValueAsDouble(Cell cell) {
        if (cell == null) return 0.0;

        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    return cell.getNumericCellValue();
                case STRING:
                    String value = cell.getStringCellValue().trim();
                    return value.isEmpty() ? 0.0 : Double.parseDouble(value);
                default:
                    return 0.0;
            }
        } catch (Exception e) {
            return 0.0;
        }
    }

    /**
     * Genera el contenido del archivo DRL
     */
    private String generarDRL(List<ReglaComision> reglas) {
        StringBuilder drl = new StringBuilder();

        // Header del DRL
        drl.append("package com.globalcmx.comisiones;\n\n");
        drl.append("import com.globalcmx.api.dto.swift.MensajeSWIFT;\n");
        drl.append("import com.globalcmx.api.dto.comision.ConfiguracionComision;\n\n");
        drl.append("// Archivo DRL generado automáticamente desde Excel\n");
        drl.append("// Generado: ").append(java.time.LocalDateTime.now()).append("\n\n");

        // Generar cada regla
        int ruleCounter = 1;
        for (ReglaComision regla : reglas) {
            String ruleName = String.format("Regla_%s_%s_%d",
                    regla.tipoMensaje.replaceAll("[^A-Za-z0-9]", "_"),
                    regla.evento.replaceAll("[^A-Za-z0-9]", "_"),
                    ruleCounter++);

            drl.append("rule \"").append(ruleName).append("\"\n");
            drl.append("    when\n");
            drl.append("        $m : MensajeSWIFT(");

            // Condiciones
            List<String> conditions = new ArrayList<>();
            if (regla.tipoMensaje != null && !regla.tipoMensaje.isEmpty()) {
                conditions.add("tipoMensaje == \"" + regla.tipoMensaje + "\"");
            }
            if (regla.evento != null && !regla.evento.isEmpty()) {
                conditions.add("evento == \"" + regla.evento + "\"");
            }
            if (regla.montoMin != null && regla.montoMin > 0) {
                conditions.add("monto >= " + regla.montoMin);
            }
            if (regla.montoMax != null && regla.montoMax > 0 && regla.montoMax < 999999999) {
                conditions.add("monto < " + regla.montoMax);
            }
            if (regla.moneda != null && !regla.moneda.isEmpty()) {
                conditions.add("moneda == \"" + regla.moneda + "\"");
            }
            if (regla.paisOrigen != null && !regla.paisOrigen.isEmpty()) {
                conditions.add("paisOrigen == \"" + regla.paisOrigen + "\"");
            }
            if (regla.paisDestino != null && !regla.paisDestino.isEmpty()) {
                conditions.add("paisDestino == \"" + regla.paisDestino + "\"");
            }

            drl.append(String.join(",\n                          ", conditions));
            drl.append(")\n");
            drl.append("        $c : ConfiguracionComision()\n");
            drl.append("    then\n");

            // Acciones
            if (regla.comisionFija != null) {
                drl.append("        $c.setComisionFija(").append(regla.comisionFija).append(");\n");
            }
            if (regla.comisionPorcentaje != null) {
                drl.append("        $c.setComisionPorcentaje(").append(regla.comisionPorcentaje).append(");\n");
            }
            if (regla.comisionMinima != null) {
                drl.append("        $c.setComisionMinima(").append(regla.comisionMinima).append(");\n");
            }
            if (regla.comisionMaxima != null) {
                drl.append("        $c.setComisionMaxima(").append(regla.comisionMaxima).append(");\n");
            }

            drl.append("end\n\n");
        }

        return drl.toString();
    }

    /**
     * Guarda el contenido DRL via CQRS command service
     */
    private void guardarDrlEnDatabase(String drlContent, String sourceFileName, byte[] sourceFileContent) {
        SaveDroolsRulesCommand command = SaveDroolsRulesCommand.builder()
                .ruleType(RULE_TYPE_COMMISSION)
                .drlContent(drlContent)
                .sourceFileName(sourceFileName)
                .sourceFileContent(sourceFileContent)
                .performedBy("SYSTEM")
                .build();

        DroolsRulesConfigReadModel saved = droolsRulesConfigCommandService.saveDroolsRulesConfig(command);
        log.info("Guardado nuevo DRL de comisiones via CQRS version={}", saved.getVersion());
    }

    /**
     * Clase interna para representar una regla de comisión
     */
    private static class ReglaComision {
        String tipoMensaje;
        String evento;
        Double montoMin;
        Double montoMax;
        String moneda;
        String paisOrigen;
        String paisDestino;
        Double comisionFija;
        Double comisionPorcentaje;
        Double comisionMinima;
        Double comisionMaxima;
    }
}
