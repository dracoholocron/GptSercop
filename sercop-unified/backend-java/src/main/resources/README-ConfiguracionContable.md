# Configuración Contable - Drools Decision Table

## Descripción

El archivo `configuracionContable.xls` es una **Decision Table de Drools** que define la configuración de cuentas contables por producto y evento en el sistema GlobalCMX.

Este archivo permite configurar de forma declarativa las reglas contables que se aplican según el tipo de producto (mensaje SWIFT) y el evento que se está procesando.

## Formato del Archivo

### Estructura Drools Decision Table

El archivo sigue el formato estándar de Drools Decision Tables:

1. **RuleSet**: Define el paquete Java donde se generarán las reglas (`com.globalcmx.contabilidad`)
2. **Import**: Especifica las clases necesarias para las reglas
3. **Sequential**: Indica si las reglas se ejecutan secuencialmente (`true`)
4. **RuleTable**: Nombre de la tabla de decisiones

### Columnas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| **A** | CONDITION | Nombre de la regla (único) |
| **B** | CONDITION | Tipo de producto/mensaje SWIFT (MT700, MT103, MT400, etc.) |
| **C** | CONDITION | Evento que dispara la regla |
| **D** | ACTION | Establece el producto en el objeto de configuración |
| **E** | ACTION | Establece el evento en el objeto de configuración |
| **F** | ACTION | Cuenta de débito (código - nombre) |
| **G** | ACTION | Cuenta de crédito (código - nombre) |
| **H** | ACTION | Estado activo/inactivo de la regla |
| **I** | ACTION | Número de línea (Line1, Line2, etc.) - Para composite entries |
| **J** | ACTION | Tipo de monto (TOTAL, COMMISSION, SWIFT_FEE, POSTAGE, VAT) |
| **K** | ACTION | Tipo de movimiento (DEBIT, CREDIT) |
| **L** | ACTION | Monto fijo (e.g., "25.00") - Opcional para cargos fijos |
| **M** | ACTION | Tasa/Porcentaje (e.g., "0.15" para VAT 15%) - Para cálculos porcentuales |
| **N** | ACTION | Gravable/Taxable (True/False) - Indica si el cargo está sujeto a impuestos |

## Productos y Eventos Configurados

### Cartas de Crédito (MT700)

#### Exportación
- **EMISSION_LC_EXPORT**: Letter of credit emission for export
- **ADVICE_LC_EXPORT**: Letter of credit advice
- **CONFIRMATION_LC_EXPORT**: LC confirmation
- **NEGOTIATION_LC_EXPORT**: Document negotiation
- **PAYMENT_LC_EXPORT**: LC payment
- **COMMISSION_LC_EXPORT**: Commission charge

#### Importación
- **EMISSION_LC_IMPORT**: Letter of credit emission for import
- **NEGOTIATION_LC_IMPORT**: Document negotiation
- **AMENDMENT_LC_IMPORT**: LC amendment/modification
- **DEFERRED_COMMISSION_LC_IMPORT**: Deferred commission on LC import
- **COMMISSION_CHARGE_LC_IMPORT**: ⚠️ Commission and internal charges (COMPOSITE ENTRY)
- **OPENING_LC_IMPORT**: LC opening
- **PAYMENT_LC_IMPORT**: Payment to foreign bank
- **ACCEPTANCE_LC_IMPORT**: Document acceptance

### Cobranzas (MT400)
- **RECEIPT_COLLECTION**: Documentary collection receipt
- **PAYMENT_COLLECTION**: Collection payment
- **COMMISSION_COLLECTION**: Collection commission

### Garantías Bancarias (MT760)
- **GUARANTEE_ISSUANCE**: Guarantee issuance
- **GUARANTEE_EXECUTION**: Guarantee execution
- **GUARANTEE_RELEASE**: Guarantee release

### Transferencias (MT103)
- **TRANSFER_SENT**: Outgoing transfer
- **TRANSFER_RECEIVED**: Incoming transfer
- **TRANSFER_COMMISSION**: Transfer commission

### Financiamiento
- **FINANCING_DISBURSEMENT**: Credit disbursement
- **PRINCIPAL_PAYMENT**: Principal payment
- **INTEREST_PAYMENT**: Interest payment
- **INTEREST_PROVISION**: Accrued interest provision

## Cuentas Contables

### Cuentas de Activo (1xxx)
- **1103.02.01**: Bancos Extranjeros - Cuentas Corrientes
- **1401.01.01**: Créditos Comerciales - Capital
- **1401.02.01**: Intereses por Cobrar
- **1402.01.01**: Créditos Comerciales - Exportación
- **1402.02.01**: Créditos Comerciales - LC Confirmadas
- **1402.03.01**: Créditos Comerciales - LC Negociadas

### Cuentas de Pasivo (2xxx)
- **2102.01.01**: Depósitos de Clientes - A la Vista
- **2102.02.01**: Depósitos de Clientes - Garantías
- **2502.01.01**: Obligaciones con Bancos Corresponsales
- **2502.02.01**: Obligaciones con Bancos - LC Importación
- **2502.03.01**: Aceptaciones Bancarias
- **2502.04.01**: Cobranzas por Pagar
- **2502.05.01**: Garantías por Pagar

### Cuentas de Ingresos (5xxx)
- **5101.01.01**: Ingresos por Comisiones - Cartas de Crédito
- **5101.02.01**: Ingresos por Comisiones - Cobranzas
- **5101.03.01**: Ingresos por Comisiones - Transferencias
- **5201.01.01**: Ingresos Financieros - Intereses

### Cuentas de Orden (9xxx)
- **9001.01.01**: Cuentas de Orden Deudoras - LC Avisadas
- **9001.02.01**: Cuentas de Orden Deudoras - LC Abiertas
- **9002.01.01**: Cuentas de Orden - Cobranzas Recibidas
- **9003.01.01**: Cuentas de Orden - Garantías Otorgadas
- **9101.01.01**: Cuentas de Orden Acreedoras - LC Avisadas
- **9101.02.01**: Cuentas de Orden Acreedoras - LC Abiertas
- **9102.01.01**: Cuentas de Orden - Cobranzas por Contra
- **9103.01.01**: Cuentas de Orden - Garantías por Contra

## Cómo Usar el Archivo

### 1. Integración con Drools

```java
// Cargar la Decision Table desde el archivo Excel
Resource resource = ResourceFactory.newClassPathResource("configuracionContable.xls");
DecisionTableConfiguration dtconf = KnowledgeBuilderFactory.newDecisionTableConfiguration();
dtconf.setInputType(DecisionTableInputType.XLS);

KnowledgeBuilder kbuilder = KnowledgeBuilderFactory.newKnowledgeBuilder();
kbuilder.add(resource, ResourceType.DTABLE, dtconf);

KnowledgeBase kbase = kbuilder.newKnowledgeBase();
StatefulKnowledgeSession ksession = kbase.newStatefulKnowledgeSession();
```

### 2. Ejecutar las Reglas

```java
// Crear objeto de configuración
ConfiguracionContable config = new ConfiguracionContable();

// Insertar hechos
ksession.insert(config);
ksession.insert("MT700");  // Producto
ksession.insert("EMISION_LC_EXPORTACION");  // Evento

// Ejecutar reglas
ksession.fireAllRules();

// Obtener resultados
String cuentaDebito = config.getCuentaDebito();
String cuentaCredito = config.getCuentaCredito();
```

### 3. Agregar Nuevas Reglas

Para agregar nuevas reglas contables:

1. Abrir `configuracionContable.xls` en Excel
2. Agregar una nueva fila con:
   - Nombre único de la regla
   - Tipo de producto (MT700, MT103, etc.)
   - Evento específico
   - Producto (repetir)
   - Evento (repetir)
   - Cuenta de débito
   - Cuenta de crédito
   - Estado (True/False)
3. Guardar el archivo
4. Recargar las reglas en el sistema

### 4. Modificar Reglas Existentes

- **Cambiar cuentas**: Modificar las columnas F (débito) o G (crédito)
- **Desactivar regla**: Cambiar columna H a `False`
- **Activar regla**: Cambiar columna H a `True`

## Validaciones

El sistema valida que:
- ✅ Cada regla tenga un nombre único
- ✅ Las cuentas débito y crédito estén definidas
- ✅ El producto y evento coincidan con los valores del sistema
- ✅ Las cuentas sigan el formato: `CÓDIGO - NOMBRE`

## Ejemplo de Uso

```java
// Scenario: LC Export Emission
String producto = "MT700";
String evento = "EMISSION_LC_EXPORT";

ConfiguracionContable config = contabilidadService.obtenerConfiguracion(producto, evento);

// Expected result:
// config.getCuentaDebito() = "1402.01.01 - COMMERCIAL CREDITS - EXPORT"
// config.getCuentaCredito() = "2102.01.01 - CUSTOMER DEPOSITS - DEMAND"
```

## Mantenimiento

### Backup
Se recomienda mantener versiones del archivo:
- `configuracionContable-v1.0.xls`
- `configuracionContable-v1.1.xls`

### Control de Cambios
Documentar cambios en:
```
Versión | Fecha | Cambios
1.0 | 2025-11-18 | Versión inicial con 22 reglas
```

## Troubleshooting

### Error: Regla no encontrada
- Verificar que el producto y evento coincidan exactamente
- Revisar que la regla esté activa (columna H = True)

### Error: Cuenta inválida
- Verificar formato: `CÓDIGO - NOMBRE`
- Asegurar que las cuentas existan en el catálogo contable

### Error al cargar Excel
- Verificar que el archivo esté en formato .xls (no .xlsx)
- Revisar que no haya columnas o filas vacías
- Verificar la estructura de la Decision Table

## Referencias

- [Drools Decision Tables Documentation](https://docs.drools.org/latest/drools-docs/drools/decision-tables/index.html)
- Plan Contable del Sistema Financiero (según regulación local)
- Mensajes SWIFT MT (ISO 15022)

---

**Archivo**: `configuracionContable.xls`
**Ubicación**: `/src/main/resources/`
**Versión**: 1.0
**Fecha**: 2025-11-18
**Total Reglas**: 22

## Actualización - 2025-11-18

### ✅ EVENTOS ACTUALIZADOS A INGLÉS (v2.0)

**CAMBIO IMPORTANTE**: Todos los eventos han sido renombrados a inglés para mantener consistencia con el sistema.

#### Mapeo de Eventos Anteriores → Nuevos

**LC Exportación:**
- ~~EMISION_LC_EXPORTACION~~ → **EMISSION_LC_EXPORT**
- ~~AVISO_LC_EXPORTACION~~ → **ADVICE_LC_EXPORT**
- ~~CONFIRMACION_LC_EXPORTACION~~ → **CONFIRMATION_LC_EXPORT**
- ~~NEGOCIACION_LC_EXPORTACION~~ → **NEGOTIATION_LC_EXPORT**
- ~~PAGO_LC_EXPORTACION~~ → **PAYMENT_LC_EXPORT**
- ~~COMISION_LC_EXPORTACION~~ → **COMMISSION_LC_EXPORT**

**LC Importación:**
- ~~EMISION~~ → **EMISSION_LC_IMPORT**
- ~~NEGOCIACION~~ → **NEGOTIATION_LC_IMPORT**
- ~~ENMIENDA~~ → **AMENDMENT_LC_IMPORT**
- ~~APERTURA_LC_IMPORTACION~~ → **OPENING_LC_IMPORT**
- ~~PAGO_LC_IMPORTACION~~ → **PAYMENT_LC_IMPORT**
- ~~ACEPTACION_LC_IMPORTACION~~ → **ACCEPTANCE_LC_IMPORT**

**Otros Productos:**
- ~~RECEPCION_COBRANZA~~ → **RECEIPT_COLLECTION**
- ~~PAGO_COBRANZA~~ → **PAYMENT_COLLECTION**
- ~~COMISION_COBRANZA~~ → **COMMISSION_COLLECTION**
- ~~EMISION_GARANTIA~~ → **GUARANTEE_ISSUANCE**
- ~~EJECUCION_GARANTIA~~ → **GUARANTEE_EXECUTION**
- ~~LIBERACION_GARANTIA~~ → **GUARANTEE_RELEASE**
- ~~TRANSFERENCIA_ENVIADA~~ → **TRANSFER_SENT**
- ~~TRANSFERENCIA_RECIBIDA~~ → **TRANSFER_RECEIVED**
- ~~COMISION_TRANSFERENCIA~~ → **TRANSFER_COMMISSION**
- ~~DESEMBOLSO_FINANCIAMIENTO~~ → **FINANCING_DISBURSEMENT**
- ~~PAGO_PRINCIPAL~~ → **PRINCIPAL_PAYMENT**
- ~~PAGO_INTERES~~ → **INTEREST_PAYMENT**
- ~~PROVISION_INTERES~~ → **INTEREST_PROVISION**

### Reglas de LC Importación

#### 1. LC Import - Emission

**Rule Details:**
- **Name**: RuleLC_Import_Emission
- **Product**: MT700
- **Event**: EMISSION_LC_IMPORT
- **Debit Account**: 630305001000000000 - LC IMPORT - EMISSION
- **Credit Account**: 640305001000000000 - LC IMPORT OBLIGATIONS
- **Status**: Active

**Accounting Explanation:**
Records the issuance of an import letter of credit:
- **Debit** 630305001000000000: Commitment assumed when issuing the LC
- **Credit** 640305001000000000: Future payment obligation

**Usage Example:**
```java
ConfiguracionContable config = configuracionService.obtenerConfiguracion("MT700", "EMISSION_LC_IMPORT");

AsientoContable asiento = configuracionService.generarAsiento(
    "MT700",
    "EMISSION_LC_IMPORT",
    new BigDecimal("50000.00"),
    "USD",
    "LC-IMP-2025-001"
);

// Result:
// DEBIT: 630305001000000000  USD 50,000.00
// CREDIT: 640305001000000000 USD 50,000.00
```

#### 2. LC Import - Negotiation

**Rule Details:**
- **Name**: RuleLC_Import_Negotiation
- **Product**: MT700
- **Event**: NEGOTIATION_LC_IMPORT
- **Debit Account**: 630305002000000000 - LC IMPORT - NEGOTIATION
- **Credit Account**: 640305002000000000 - LC IMPORT OBLIGATIONS - NEGOTIATION
- **Status**: Active

**Accounting Explanation:**
Records document negotiation in an import letter of credit:
- **Debit** 630305002000000000: Negotiated documentary credit
- **Credit** 640305002000000000: Payment obligation for negotiation

**Usage Example:**
```java
ConfiguracionContable config = configuracionService.obtenerConfiguracion("MT700", "NEGOTIATION_LC_IMPORT");

AsientoContable asiento = configuracionService.generarAsiento(
    "MT700",
    "NEGOTIATION_LC_IMPORT",
    new BigDecimal("75000.00"),
    "USD",
    "LC-IMP-2025-002"
);

// Result:
// DEBIT: 630305002000000000  USD 75,000.00
// CREDIT: 640305002000000000 USD 75,000.00
```

#### 3. LC Import - Amendment

**Rule Details:**
- **Name**: RuleLC_Import_Amendment
- **Product**: MT700
- **Event**: AMENDMENT_LC_IMPORT
- **Debit Account**: 630305003000000000 - LC IMPORT - AMENDMENT
- **Credit Account**: 640305003000000000 - LC IMPORT OBLIGATIONS - AMENDMENT
- **Status**: Active

**Accounting Explanation:**
Records amendments or modifications to an import letter of credit:
- **Debit** 630305003000000000: Adjustments to LC commitment due to amendment
- **Credit** 640305003000000000: Adjustments to obligation due to amendment

**Usage Example:**
```java
ConfiguracionContable config = configuracionService.obtenerConfiguracion("MT700", "AMENDMENT_LC_IMPORT");

AsientoContable asiento = configuracionService.generarAsiento(
    "MT700",
    "AMENDMENT_LC_IMPORT",
    new BigDecimal("10000.00"),
    "USD",
    "LC-IMP-2025-003"
);

// Result:
// DEBIT: 630305003000000000  USD 10,000.00
// CREDIT: 640305003000000000 USD 10,000.00
```

#### 4. LC Import - Deferred Commission

**Rule Details:**
- **Name**: RuleLC_Import_DeferredCommission
- **Product**: MT700
- **Event**: DEFERRED_COMMISSION_LC_IMPORT
- **Debit Account**: 719090024000000000 - LC IMPORT - DEFERRED COMMISSION
- **Credit Account**: 729090024000000000 - LC IMPORT - DEFERRED COMMISSION PAYABLE
- **Status**: Active

**Accounting Explanation:**
Records deferred commissions on import letters of credit:
- **Debit** 719090024000000000: Deferred commission expense recognition
- **Credit** 729090024000000000: Commission payable obligation

This entry is typically used when commissions are charged but payment is deferred to a future date, allowing for proper accrual accounting treatment.

**Usage Example:**
```java
ConfiguracionContable config = configuracionService.obtenerConfiguracion("MT700", "DEFERRED_COMMISSION_LC_IMPORT");

AsientoContable asiento = configuracionService.generarAsiento(
    "MT700",
    "DEFERRED_COMMISSION_LC_IMPORT",
    new BigDecimal("1500.00"),
    "USD",
    "LC-IMP-2025-004"
);

// Result:
// DEBIT: 719090024000000000  USD 1,500.00
// CREDIT: 729090024000000000 USD 1,500.00
```

---

#### 5. LC Import - Commission Charge (COMPOSITE ENTRY) ⚠️

**Rule Details:**
- **Name**: RuleLC_Import_CommissionCharge
- **Product**: MT700
- **Event**: COMMISSION_CHARGE_LC_IMPORT
- **Type**: COMPOSITE ENTRY (multiple accounts)
- **Status**: Active

**⚠️ IMPORTANT**: This rule requires special handling as it involves **5 accounts** in a single composite entry.

**Accounts Affected:**

1. **DEBIT**: Customer Account (variable)
   - Description: Customer's deposit account
   - Amount: Total of items 2 + 3 + 4 + 5

2. **CREDIT**: 520500300000000000 - COMMISSION INCOME - LC IMPORT
   - Description: Calculated commission on LC
   - Amount: Variable (calculated based on LC amount and rates)

3. **CREDIT**: 559004600000000000 - SWIFT MESSAGE SERVICE FEE
   - Description: Charge for SWIFT message transmission
   - Amount: **Fixed $25.00** (configured in Excel Column L)

4. **CREDIT**: 559005300000000000 - POSTAGE SERVICE FEE
   - Description: Charge for document handling and postage
   - Amount: Variable OR **Fixed** (configurable in Excel Column L)

5. **CREDIT**: 250405050010000000 - VAT ON SERVICES
   - Description: Value Added Tax applied to charges marked as taxable
   - Rate: **Configurable in Excel Column M** (default: 0.15 for 15%)
   - Taxable Items: **Configurable in Excel Column N** (each charge can be marked True/False)
   - Formula: `(Sum of all charges where Taxable=True) × VAT_Rate`
   - Default: SWIFT Fee + Postage Fee are taxable, Commission is not
   - **FULLY FLEXIBLE**: Each country can configure which charges are taxable!

**Accounting Equation:**
```
DEBIT = CREDIT
Customer Account = Commission + SWIFT Fee + Postage + VAT
```

**VAT Calculation:**
```
VAT Base = SWIFT Fee + Postage
VAT Amount = VAT Base × 0.15
```

**Usage Example:**
```java
// Example: LC Import with commission $500, postage $50
String customerAccount = "210201001012345678";
BigDecimal commission = new BigDecimal("500.00");
BigDecimal postage = new BigDecimal("50.00");

// Generate composite entry
AsientoContable asiento = compositeEntryService.generarCobroComisionesLCImport(
    customerAccount,
    commission,
    postage,
    "LC-IMP-2025-005"
);

// Result:
// DEBIT:  210201001012345678 (Customer Account)    USD  586.25
// CREDIT: 520500300000000000 (Commission Income)    USD  500.00
// CREDIT: 559004600000000000 (SWIFT Service)        USD   25.00
// CREDIT: 559005300000000000 (Postage Service)      USD   50.00
// CREDIT: 250405050010000000 (VAT 15%)              USD   11.25
//                                                   ================
//                                            TOTAL: USD  586.25
```

**Calculation Breakdown:**
```
Commission (520500300000000000):     $500.00
SWIFT Fee (559004600000000000):      $ 25.00 (fixed from Column L)
Postage (559005300000000000):        $ 50.00 (fixed from Column L)
───────────────────────────────────────────────────────────────────
VAT Formula (250405050010000000):
  = (Account_559004600000000000 + Account_559005300000000000) × VAT_Rate
  = ($25.00 + $50.00) × 0.15
  = $75.00 × 0.15
VAT Amount:                          $ 11.25
───────────────────────────────────────────────────────────────────
Total Charge:                        $586.25
```

**Implementation Notes:**
- See `composite-entry-example.java` for full implementation
- The service automatically validates accounting equation balance
- VAT only applies to service fees (SWIFT + Postage), NOT to commission
- Customer account number is passed as parameter
- All amounts in USD
- **Fixed amounts** can be configured in Excel Column L:
  - SWIFT_FEE: Set to "25.00" in Column L
  - POSTAGE: Can be set to a fixed value (e.g., "50.00") or left empty to use parameter
  - If Column L is empty, the value from method parameter is used
- **Percentage rates** can be configured in Excel Column M:
  - VAT: Set to "0.15" in Column M for 15% rate
  - To change VAT to 16%: Set Column M to "0.16"
  - If Column M is empty, default rate of 0.15 (15%) is used

---

**Total Rules**: 31
**Last Update**: 2025-11-18 21:00

## 🎯 Composite Entries - Fully Parametrizable Solution

The **COMMISSION_CHARGE_LC_IMPORT** event now uses **5 separate Drools rules** instead of hardcoded accounts:

**Advantages of this approach:**
✅ **100% Configurable** - All accounts defined in Excel
✅ **Bank-Specific** - Each bank can customize accounts
✅ **No Code Changes** - Just edit the Excel file
✅ **Fully Auditable** - All rules visible in decision table
✅ **Maintains Drools Benefits** - Rules engine handles everything

**How it works:**
1. **5 Rules with Same Event** - All have `COMMISSION_CHARGE_LC_IMPORT` event
2. **Line Numbers** (Column I) - Each rule has Line1, Line2, Line3, Line4, Line5
3. **Amount Types** (Column J) - TOTAL, COMMISSION, SWIFT_FEE, POSTAGE, VAT
4. **Movement Types** (Column K) - DEBIT or CREDIT
5. **Fixed Amounts** (Column L) - Optional for fixed fees (SWIFT_FEE, POSTAGE)
6. **Percentage Rates** (Column M) - Optional for calculated fees (VAT)
7. **Service Assembles** - Java code reads all 5 rules and builds composite entry

**To customize for your bank:**
Simply edit the account numbers in the Excel file - no coding required!

### Example: Customizing Accounts for Different Banks

**Bank A (Current Configuration):**
```
Line2: 520500300000000000 - Commission Income
Line3: 559004600000000000 - SWIFT Service
Line4: 559005300000000000 - Postage Service
Line5: 250405050010000000 - VAT 15%
```

**Bank B (Custom Configuration):**
Just edit the Excel and change to:
```
Line2: 410200500000000000 - Commission Income (Bank B's account)
Line3: 560100200000000000 - SWIFT Service (Bank B's account)
Line4: 560100300000000000 - Postage Service (Bank B's account)
Line5: 240300100000000000 - VAT 15% (Bank B's account)
```

**No code changes needed!** The service automatically reads the new accounts from Excel.

### Configuring Fixed Amounts (Column L)

**What are Fixed Amounts?**
Some fees are constant and don't change per transaction (e.g., SWIFT message fee). These can be configured directly in the Excel file using Column L.

**How to Configure:**

1. **Open configuracionContable.xls** in Excel
2. **Navigate to Column L** ("Fixed Amount")
3. **Enter the fixed amount** for the rule (e.g., "25.00" for SWIFT_FEE)
4. **Save the file**
5. **Reload the rules** in the application

**Example Configuration:**

| Rule Name | Amount Type | Fixed Amount (Column L) | Behavior |
|-----------|-------------|------------------------|----------|
| RuleLC_Import_CommissionCharge_Line3 | SWIFT_FEE | 25.00 | Always charges $25.00 |
| RuleLC_Import_CommissionCharge_Line4 | POSTAGE | 50.00 | Always charges $50.00 (fixed) |
| RuleLC_Import_CommissionCharge_Line4 | POSTAGE | (empty) | Uses value from method parameter |

**Supported Amount Types for Fixed Amounts:**
- ✅ **SWIFT_FEE** - Typically $25.00
- ✅ **POSTAGE** - Can be fixed (e.g., $50.00) or variable
- ✅ Any other fee type that should have a constant value

**When to Use Fixed Amounts:**
- Use when the fee is **standardized** across all transactions
- Use when the fee is **regulatory** or **policy-based**
- Use when you want **centralized control** of fee amounts

**When NOT to Use Fixed Amounts:**
- When the fee **varies per transaction**
- When the fee is **calculated dynamically** (like commission percentages)
- When the fee depends on **external factors** (like customer tier)

**Benefits:**
- ✅ Easy to update fees without code changes
- ✅ Centralized fee management
- ✅ Audit trail through Excel version control
- ✅ Flexibility - can switch between fixed and variable

### Configuring Percentage Rates (Column M)

**What are Percentage Rates?**
Some charges are calculated as a percentage of other amounts (e.g., VAT on service fees). These rates can be configured in the Excel file using Column M.

**How to Configure:**

1. **Open configuracionContable.xls** in Excel
2. **Navigate to Column M** ("Rate/Percentage")
3. **Enter the decimal rate** for the rule (e.g., "0.15" for 15%, "0.16" for 16%)
4. **Save the file**
5. **Reload the rules** in the application

**Example Configuration:**

| Rule Name | Amount Type | Rate (Column M) | Calculation |
|-----------|-------------|-----------------|-------------|
| RuleLC_Import_CommissionCharge_Line5 | VAT | 0.15 | 15% tax on SWIFT + POSTAGE |
| RuleLC_Import_CommissionCharge_Line5 | VAT | 0.16 | 16% tax on SWIFT + POSTAGE |
| RuleLC_Import_CommissionCharge_Line5 | VAT | (empty) | Uses default 15% |

**Supported Amount Types for Rates:**
- ✅ **VAT** - Typically 0.15 (15%), but can vary by country
- ✅ **Any percentage-based fee** - Commission percentages, interest rates, etc.

**Common VAT Rates by Country:**
- Mexico: 0.16 (16%)
- USA: varies by state (0.00 - 0.10)
- Europe: varies (0.15 - 0.27)
- Canada: 0.05 - 0.15 (GST/HST)

**When to Use Rates:**
- Use when the charge is **calculated as a percentage**
- Use when the rate is **subject to regulatory changes**
- Use when you need **centralized rate management**

**Example Calculation:**
```
Account 559004600000000000 (SWIFT Fee):    $25.00 (from Column L)
Account 559005300000000000 (Postage Fee):  $15.00 (from Column L)
Base Amount:                                $40.00

VAT Formula for Account 250405050010000000:
  = (Account_559004600000000000 + Account_559005300000000000) × VAT_Rate
  = ($25.00 + $15.00) × 0.15
  = $40.00 × 0.15
VAT Amount:                                 $6.00
```

**Benefits:**
- ✅ Easy to update tax rates when regulations change
- ✅ No code deployment needed for rate changes
- ✅ Supports multi-country operations with different rates
- ✅ Centralized rate governance

### Configuring Taxable Charges (Column N) 🌍

**BREAKING CHANGE - Version 4.0**: The VAT calculation is now FULLY FLEXIBLE!

**What Changed?**
Previously, the VAT formula was hardcoded in Java: `VAT = (SWIFT + POSTAGE) × Rate`

Now, each charge can be individually marked as taxable in Excel Column N, providing complete flexibility for different countries and tax regulations.

**How to Configure:**

1. **Open configuracionContable.xls** in Excel
2. **Navigate to Column N** ("Taxable")
3. **Set True/False** for each charge line
4. **Save the file**
5. **Reload the rules** in the application

**Configuration Examples by Country:**

| Country | Tax Rule | COMMISSION | SWIFT_FEE | POSTAGE | Result |
|---------|----------|------------|-----------|---------|--------|
| **USA** | Most services taxable | False | True | True | VAT = (SWIFT + POSTAGE) × Rate |
| **Mexico** | All fees taxable | True | True | True | VAT = (COMMISSION + SWIFT + POSTAGE) × Rate |
| **UK** | Only messaging taxable | False | True | False | VAT = (SWIFT) × Rate |
| **Singapore** | No service tax on commission | False | True | True | VAT = (SWIFT + POSTAGE) × Rate |

**Example: USA Configuration (Default)**
```
Line2 (COMMISSION):  Taxable = False  →  $500.00 NOT included in VAT base
Line3 (SWIFT_FEE):   Taxable = True   →  $ 25.00 INCLUDED in VAT base
Line4 (POSTAGE):     Taxable = True   →  $ 15.00 INCLUDED in VAT base
─────────────────────────────────────────────────────────────────
Taxable Base = $40.00
VAT = $40.00 × 0.15 = $6.00
```

**Example: Mexico Configuration (All taxable)**
```
Line2 (COMMISSION):  Taxable = True   →  $500.00 INCLUDED in VAT base
Line3 (SWIFT_FEE):   Taxable = True   →  $ 25.00 INCLUDED in VAT base
Line4 (POSTAGE):     Taxable = True   →  $ 15.00 INCLUDED in VAT base
─────────────────────────────────────────────────────────────────
Taxable Base = $540.00
VAT = $540.00 × 0.16 = $86.40
```

**When to Use Taxable Flag:**
- ✅ Different tax rules by country
- ✅ Regulatory compliance requirements
- ✅ Multi-country operations with different tax jurisdictions
- ✅ Frequent changes to tax regulations

**Benefits:**
- ✅ **NO CODE CHANGES** when tax rules change
- ✅ **Multi-country support** - each country configures its own rules
- ✅ **Regulatory compliance** - easy to adapt to new tax laws
- ✅ **Fully auditable** - tax logic visible in Excel
- ✅ **Bank-specific** - each bank can customize for their jurisdiction

**Technical Implementation:**
The Java code now dynamically sums all charges where `Taxable = True`:
```java
BigDecimal taxableBase = calculateTaxableBase(rules, commission, swiftFee, postage);
BigDecimal vatAmount = taxableBase.multiply(vatRate);
```

No assumptions about which charges are taxable - everything configured in Excel!

### Version Control

| Version | Date | Rules | Changes |
|---------|------|-------|---------|
| 1.0 | 2025-11-18 09:00 | 22 | Initial version (Spanish events) |
| 1.1 | 2025-11-18 18:15 | 23 | Added MT700/EMISION rule |
| 1.2 | 2025-11-18 19:30 | 24 | Added MT700/NEGOCIACION rule |
| 1.3 | 2025-11-18 19:45 | 25 | Added MT700/ENMIENDA rule |
| **2.0** | **2025-11-18 20:00** | **25** | **ALL EVENTS RENAMED TO ENGLISH** |
| **2.1** | **2025-11-18 20:15** | **26** | **Added DEFERRED_COMMISSION_LC_IMPORT** |
| **2.2** | **2025-11-18 20:30** | **27** | **Added COMMISSION_CHARGE_LC_IMPORT (COMPOSITE - hardcoded)** |
| **3.0** | **2025-11-18 21:00** | **31** | **COMPOSITE ENTRIES NOW FULLY PARAMETRIZABLE** ✅ |
| **3.1** | **2025-11-18 21:30** | **31** | **Added Fixed Amount support (Column L) - SWIFT & POSTAGE** ✅ |
| **3.2** | **2025-11-18 22:00** | **31** | **Added Percentage Rate support (Column M) - VAT configurable** ✅ |
| **4.0** | **2025-11-18 23:00** | **31** | **Added Taxable Flag (Column N) - FULLY FLEXIBLE VAT** 🌍✅ |
