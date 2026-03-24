# Configuración de Comisiones SWIFT con Drools - Comercio Exterior

## Descripción

Este archivo Excel (`comisiones-swift-config.xlsx`) contiene la configuración de comisiones para **mensajes SWIFT de Comercio Exterior** procesados por el sistema. Utiliza el formato de **Drools Decision Table** para definir reglas de negocio de manera declarativa.

## Mensajes SWIFT Incluidos

### Categoría 4 - Cobranzas Documentarias (MT4xx)
- **MT400**: Aviso de Cobranza
- **MT410**: Acuse de Recibo de Cobranza
- **MT412**: Aviso de Aceptación
- **MT416**: Aviso de Pago
- **MT420**: Rastreo de Cobranza

### Categoría 7 - Créditos Documentarios y Garantías (MT7xx)
- **MT700**: Emisión de Carta de Crédito
- **MT701**: Emisión de Carta de Crédito Stand-by
- **MT707/MT747**: Modificación de Carta de Crédito
- **MT710**: Aviso de Carta de Crédito de Tercero
- **MT711**: Aviso de Carta de Crédito Stand-by de Tercero
- **MT720**: Transferencia de Carta de Crédito
- **MT730**: Acuse de Recibo
- **MT732**: Aviso de Incumplimiento/Rechazo
- **MT734**: Aviso de Renuncia
- **MT740**: Autorización para Reembolsar
- **MT742**: Reclamación de Reembolso
- **MT750**: Aviso de Discrepancia
- **MT752**: Autorización para Pagar/Aceptar/Negociar
- **MT754**: Aviso de Pago/Aceptación
- **MT756**: Aviso de Reembolso
- **MT760**: Garantía Bancaria
- **MT767**: Modificación de Garantía
- **MT799**: Mensaje de Texto Libre entre Bancos

## Eventos Incluidos por Operación

- **EMISION**: Emisión inicial del instrumento
- **AVISO**: Aviso a las partes involucradas
- **RECEPCION**: Confirmación de recepción
- **ACEPTACION**: Aceptación de la operación
- **PAGO**: Ejecución del pago
- **MODIFICACION**: Cambios en el instrumento
- **AUTORIZACION**: Autorización de operación
- **RECLAMACION**: Solicitud de reembolso
- **DISCREPANCIA**: Notificación de problemas
- **RECHAZO**: Rechazo de la operación
- **RENUNCIA**: Renuncia a derechos
- **REEMBOLSO**: Devolución de fondos
- **TRANSFERENCIA**: Transferencia de derechos
- **RASTREO**: Seguimiento de operación
- **CONSULTA**: Consultas entre bancos

## Estructura del Archivo

### Metadatos de Drools (Filas 1-6)

```
RuleSet: com.globalcmx.comisiones
Import: com.globalcmx.api.dto.swift.MensajeSWIFT
Import: com.globalcmx.api.dto.comision.ConfiguracionComision
Sequential: true
```

### Tabla de Decisión (Fila 7 en adelante)

#### Condiciones (CONDITION)
- **Tipo Mensaje**: Tipo de mensaje SWIFT (MT400, MT700, MT760, etc.)
- **Evento**: Evento específico del ciclo de vida (EMISION, PAGO, MODIFICACION, etc.)
- **Monto Desde**: Monto mínimo para aplicar la regla
- **Monto Hasta**: Monto máximo para aplicar la regla
- **Moneda**: Código de moneda (USD, EUR, MXN, etc.)
- **País Origen**: Código del país de origen
- **País Destino**: Código del país de destino

#### Acciones (ACTION)
- **Comisión Fija**: Monto fijo a cobrar (ej: 10.00)
- **Comisión Porcentaje**: Porcentaje a aplicar sobre el monto (ej: 1.5)
- **Comisión Mínima**: Monto mínimo de comisión
- **Comisión Máxima**: Monto máximo de comisión

## Ejemplos de Reglas

### Regla 1: Emisión de Carta de Crédito - Pequeña
```
Tipo: MT700
Evento: EMISION
Monto: 0 - 100,000 USD
Países: MX → US
Comisión: $250 fija (mín: $200, máx: $1,000)
```

### Regla 2: Emisión de Carta de Crédito - Mediana
```
Tipo: MT700
Evento: EMISION
Monto: 100,000 - 500,000 USD
Países: MX → US
Comisión: 0.25% (mín: $250, máx: $2,000)
```

### Regla 3: Emisión de Garantía Bancaria - Grande
```
Tipo: MT760
Evento: EMISION
Monto: >1,000,000 USD
Países: MX → US
Comisión: 0.12% (mín: $500, máx: $5,000)
```

### Regla 4: Cobranza Documentaria
```
Tipo: MT400
Evento: EMISION
Monto: 0 - 50,000 USD
Países: MX → US
Comisión: $150 fija (mín: $100, máx: $500)
```

### Regla 5: Modificación de Carta de Crédito
```
Tipo: MT707
Evento: MODIFICACION
Cualquier monto USD
Países: MX → US
Comisión: $150 fija (mín: $100, máx: $800)
```

## Cómo Editar el Archivo

### 1. Abrir con Excel o LibreOffice Calc

El archivo puede editarse con cualquier herramienta compatible con formato XLSX.

### 2. Agregar Nueva Regla

Para agregar una nueva regla:
1. Copiar una fila existente (desde la fila 10 en adelante)
2. Pegar en la siguiente fila vacía
3. Modificar los valores según la nueva regla
4. Guardar el archivo

### 3. Modificar Regla Existente

1. Localizar la fila de la regla a modificar
2. Cambiar los valores en las celdas correspondientes
3. Guardar el archivo

### 4. Eliminar Regla

1. Localizar la fila de la regla a eliminar
2. Eliminar la fila completa
3. Guardar el archivo

## Integración con Drools

### Dependencia Maven

```xml
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-decisiontables</artifactId>
    <version>8.44.0.Final</version>
</dependency>
```

### Código de Integración

```java
// Cargar Decision Table desde Excel
DecisionTableConfiguration dtConfiguration =
    KnowledgeBuilderFactory.newDecisionTableConfiguration();
dtConfiguration.setInputType(DecisionTableInputType.XLS);

KnowledgeBuilder kbuilder = KnowledgeBuilderFactory.newKnowledgeBuilder();
Resource xlsRes = ResourceFactory.newClassPathResource(
    "comisiones-swift-config.xlsx"
);
kbuilder.add(xlsRes, ResourceType.DTABLE, dtConfiguration);

// Crear sesión y ejecutar reglas
KieServices ks = KieServices.Factory.get();
KieContainer kContainer = ks.newKieClasspathContainer();
KieSession kSession = kContainer.newKieSession();

// Insertar hechos
MensajeSWIFT mensaje = new MensajeSWIFT();
mensaje.setTipoMensaje("MT700");
mensaje.setEvento("EMISION");
mensaje.setMonto(150000.0);
mensaje.setMoneda("USD");
mensaje.setPaisOrigen("MX");
mensaje.setPaisDestino("US");

ConfiguracionComision config = new ConfiguracionComision();

kSession.insert(mensaje);
kSession.insert(config);

// Ejecutar reglas
kSession.fireAllRules();

// Obtener resultado
double comisionCalculada = calcularComision(config, mensaje);
```

## DTOs Requeridos

### MensajeSWIFT.java
```java
public class MensajeSWIFT {
    private String tipoMensaje;  // MT400, MT700, MT760, etc.
    private String evento;        // EMISION, PAGO, MODIFICACION, etc.
    private Double monto;
    private String moneda;       // USD, EUR, MXN
    private String paisOrigen;   // MX, US, ES
    private String paisDestino;
    // getters y setters
}
```

### ConfiguracionComision.java
```java
public class ConfiguracionComision {
    private Double comisionFija;
    private Double comisionPorcentaje;
    private Double comisionMinima;
    private Double comisionMaxima;
    // getters y setters
}
```

## Ventajas del Enfoque con Excel

1. **No Requiere Recompilación**: Las reglas pueden modificarse sin recompilar el código
2. **Accesible**: Personal de negocio puede mantener las reglas
3. **Versionable**: El archivo puede versionarse en Git
4. **Auditable**: Cada cambio queda registrado en el historial
5. **Testeable**: Fácil crear casos de prueba basados en las reglas

## Consideraciones

- **Orden de Reglas**: Con `Sequential: true`, las reglas se evalúan en orden
- **Rangos de Montos**: Asegurar que no haya gaps o sobreposiciones
- **Validación**: Implementar validación al cargar el archivo
- **Cache**: Considerar cachear las reglas compiladas para mejor rendimiento
- **Hot Reload**: Implementar recarga en caliente para cambios sin reinicio

## Script de Generación

El archivo fue generado usando el script `crear_config_comisiones.py`. Para regenerar:

```bash
python3 crear_config_comisiones.py
```

## Notas Adicionales

- Los montos están en la moneda especificada
- Los porcentajes son valores decimales (1.5 = 1.5%)
- Los rangos de montos son inclusivos en el límite inferior y exclusivos en el superior
- Se aplica solo la primera regla que coincida (debido a Sequential: true)
