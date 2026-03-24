# Configuración Contable SWIFT

## Descripción

Este archivo Excel (`contabilidad-swift-config.xlsx`) contiene la configuración de asientos contables automáticos basados en mensajes SWIFT, según la normativa contable ecuatoriana.

## Estructura del Archivo

### Columnas

| Columna | Descripción | Tipo | Ejemplo |
|---------|-------------|------|---------|
| **ID** | Identificador único de la regla | Número | 1 |
| **Tipo_Mensaje_SWIFT** | Código del mensaje SWIFT | Texto | MT700, MT103, MT400 |
| **Evento** | Tipo de evento contable | Texto | EMISION, RECEPCION, PAGO |
| **Monto_Minimo** | Monto mínimo aplicable | Numérico | 0, 50000, 100000 |
| **Monto_Maximo** | Monto máximo aplicable | Numérico | 50000, 999999999 |
| **Moneda** | Código de moneda ISO | Texto | USD, EUR, GBP |
| **Pais_Origen** | Código país origen ISO | Texto | EC, US, ES |
| **Pais_Destino** | Código país destino ISO | Texto | EC, US, ES |
| **Cuenta_Debito_Codigo** | Código cuenta contable débito | Texto | 1103.01.01 |
| **Cuenta_Debito_Nombre** | Nombre cuenta débito | Texto | BANCOS NACIONALES - CUENTAS CORRIENTES |
| **Cuenta_Credito_Codigo** | Código cuenta contable crédito | Texto | 5103.01.01 |
| **Cuenta_Credito_Nombre** | Nombre cuenta crédito | Texto | COMISIONES COBRADAS - COBRANZAS |
| **Descripcion** | Descripción del asiento | Texto | Emisión carta de crédito importación |
| **Activo** | Estado de la regla | Texto | SI, NO |

## Plan de Cuentas Ecuatoriano

### Cuentas Principales Utilizadas

#### Activos (1xxx)
- **1103.01.01** - BANCOS NACIONALES - CUENTAS CORRIENTES
- **1103.02.01** - BANCOS EXTRANJEROS - CUENTAS CORRIENTES
- **1103.02.02** - BANCOS EXTRANJEROS - NOSTRO ACCOUNTS

#### Pasivos (2xxx)
- **2502.01.01** - OBLIGACIONES CON CLIENTES - DEPOSITOS A LA VISTA

#### Gastos (4xxx)
- **4502.01.01** - GASTOS DE OPERACION - GASTOS BANCARIOS
- **4503.01.01** - PERDIDA EN OPERACIONES CAMBIARIAS

#### Ingresos (5xxx)
- **5103.01.01** - COMISIONES COBRADAS - COBRANZAS
- **5103.01.02** - COMISIONES COBRADAS - TRANSFERENCIAS
- **5103.02.01** - COMISIONES COBRADAS - CARTAS DE CREDITO
- **5103.03.01** - COMISIONES COBRADAS - GARANTIAS
- **5202.01.01** - UTILIDAD EN OPERACIONES CAMBIARIAS

#### Cuentas Contingentes Deudoras (7xxx)
- **7301.01.01** - CONTINGENTES DEUDORAS - CARTAS DE CREDITO EMITIDAS
- **7301.01.02** - CONTINGENTES DEUDORAS - CARTAS DE CREDITO IRREVOCABLES
- **7301.01.03** - CONTINGENTES DEUDORAS - CARTAS DE CREDITO TRANSFERIDAS
- **7301.02.01** - CONTINGENTES DEUDORAS - CARTAS DE CREDITO AVISADAS
- **7301.03.01** - CONTINGENTES DEUDORAS - GARANTIAS EMITIDAS

#### Cuentas Contingentes Acreedoras (7xxx)
- **7401.01.01** - CONTINGENTES ACREEDORAS - CARTAS DE CREDITO EMITIDAS
- **7401.01.02** - CONTINGENTES ACREEDORAS - CARTAS DE CREDITO IRREVOCABLES
- **7401.01.03** - CONTINGENTES ACREEDORAS - CARTAS DE CREDITO TRANSFERIDAS
- **7401.02.01** - CONTINGENTES ACREEDORAS - CARTAS DE CREDITO AVISADAS
- **7401.03.01** - CONTINGENTES ACREEDORAS - GARANTIAS EMITIDAS

## Mensajes SWIFT Soportados

### Serie MT4xx - Cobranzas
- **MT400** - Emisión de Orden de Pago
- **MT410** - Recepción de Orden de Pago
- **MT412** - Aceptación de Orden de Pago
- **MT416** - Pago de Cobranza

### Serie MT7xx - Cartas de Crédito y Garantías
- **MT700** - Emisión de Carta de Crédito
- **MT701** - Emisión de Carta de Crédito Irrevocable
- **MT707** - Modificación de Carta de Crédito
- **MT710** - Aviso de Carta de Crédito
- **MT720** - Transferencia de Carta de Crédito
- **MT730** - Reconocimiento de Carta de Crédito
- **MT740** - Autorización de Pago
- **MT742** - Reclamación por Discrepancias
- **MT747** - Modificación de Carta de Crédito Avisada
- **MT760** - Emisión de Garantía Bancaria
- **MT767** - Modificación de Garantía Bancaria

### Serie MT1xx y MT2xx - Transferencias
- **MT103** - Transferencias de Cliente
- **MT202** - Transferencias Interbancarias

### Serie MT9xx - Confirmaciones
- **MT900** - Confirmación de Débito
- **MT910** - Confirmación de Crédito

## Eventos Contables

Los eventos soportados incluyen:

1. **EMISION** - Emisión de documentos (cartas de crédito, garantías)
2. **RECEPCION** - Recepción de documentos
3. **ACEPTACION** - Aceptación de cobranzas
4. **PAGO** - Pago de documentos
5. **MODIFICACION** - Modificaciones de documentos
6. **AVISO** - Avisos de cartas de crédito
7. **TRANSFERENCIA** - Transferencias de documentos
8. **AUTORIZACION** - Autorizaciones de pago
9. **RECLAMACION** - Reclamaciones por discrepancias
10. **COMISION_APERTURA** - Cobro de comisiones por apertura
11. **COMISION_TRANSFERENCIA** - Cobro de comisiones por transferencias
12. **GASTOS_BANCARIOS** - Registro de gastos bancarios
13. **DIFERENCIAL_CAMBIARIO_GANANCIA** - Ganancia cambiaria
14. **DIFERENCIAL_CAMBIARIO_PERDIDA** - Pérdida cambiaria
15. **TRANSFERENCIA_ENVIADA** - Transferencia enviada al exterior
16. **TRANSFERENCIA_RECIBIDA** - Transferencia recibida del exterior
17. **TRANSFERENCIA_INTERBANCARIA** - Transferencia entre bancos
18. **CONFIRMACION_DEBITO** - Confirmación de débito en nostro
19. **CONFIRMACION_CREDITO** - Confirmación de crédito en nostro

## Uso con Drools

Este archivo está diseñado para ser procesado por Drools y generar reglas de negocio automáticas.

### Proceso de Generación de Reglas

1. **Lectura del Excel**: Un servicio lee el archivo Excel
2. **Validación**: Se validan los datos y la estructura
3. **Generación DRL**: Se genera un archivo `.drl` con las reglas de Drools
4. **Aplicación**: Las reglas se aplican automáticamente al procesar mensajes SWIFT

### Ejemplo de Regla Generada

```drools
rule "Regla_Contable_MT700_EMISION_1"
    when
        $m : MensajeSWIFT(tipoMensaje == "MT700",
                          evento == "EMISION",
                          monto >= 0,
                          monto < 100000,
                          moneda == "USD",
                          paisOrigen == "EC",
                          paisDestino == "US")
        $a : AsientoContable()
    then
        $a.agregarPartida("DEBITO", "7301.01.01",
                         "CONTINGENTES DEUDORAS - CARTAS DE CREDITO EMITIDAS");
        $a.agregarPartida("CREDITO", "7401.01.01",
                         "CONTINGENTES ACREEDORAS - CARTAS DE CREDITO EMITIDAS");
        $a.setDescripcion("Emisión carta de crédito importación hasta 100K USD");
end
```

## Mantenimiento

### Agregar Nueva Configuración

1. Abrir el archivo Excel
2. Agregar una nueva fila con los datos requeridos
3. Asignar un ID único incremental
4. Guardar el archivo
5. Regenerar las reglas Drools

### Modificar Configuración Existente

1. Localizar la configuración por ID
2. Modificar los valores necesarios
3. Guardar el archivo
4. Regenerar las reglas Drools

### Desactivar Configuración

1. Cambiar el campo **Activo** de "SI" a "NO"
2. Guardar el archivo
3. Regenerar las reglas Drools

## Normativa Aplicable

- **Plan de Cuentas**: Basado en normativa de la Superintendencia de Bancos del Ecuador
- **NIIF**: Normas Internacionales de Información Financiera
- **NIC 39**: Instrumentos Financieros: Reconocimiento y Medición
- **NIIF 9**: Instrumentos Financieros (versión actualizada)

## Consideraciones Importantes

1. **Cuentas Contingentes**: Las cartas de crédito y garantías se registran en cuentas de orden (contingentes)
2. **Reversión**: Al liquidar una carta de crédito, se reversa el asiento contingente
3. **Comisiones**: Se registran como ingreso en el momento del devengo
4. **Diferencial Cambiario**: Se reconoce al momento de la transacción

## Soporte

Para consultas o modificaciones, contactar al equipo de desarrollo o al departamento de contabilidad.

---

**Generado**: 2025-10-23
**Versión**: 1.0
**Autor**: Sistema GlobalCMX
