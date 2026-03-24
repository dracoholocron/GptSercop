# Configuración Aplicada - configuracionContable.xls

## ✅ Actualización Completada - Version 4.0 🌍

Fecha: 2025-11-18 23:00

**BREAKING CHANGE**: VAT calculation is now FULLY FLEXIBLE!

### Cambios Aplicados

Se han agregado y configurado las siguientes columnas al archivo `configuracionContable.xls`:

#### **Column L - Fixed Amount (Montos Fijos)**
Permite configurar valores fijos para cargos que no varían por transacción.

#### **Column M - Rate/Percentage (Tasas/Porcentajes)**
Permite configurar tasas porcentuales para cálculos como impuestos.

#### **Column N - Taxable (Gravable) 🌍 NEW!**
Permite configurar qué cargos están sujetos a impuestos. **COMPLETAMENTE FLEXIBLE** para diferentes países y regulaciones fiscales.

---

## Configuración de Composite Entry - COMMISSION_CHARGE_LC_IMPORT

### Reglas Configuradas (5 líneas)

#### Line1 - Customer Debit (TOTAL)
- **Rule Name**: RuleLC_Imp_CommCharge_Line1
- **Line Number**: Line1
- **Amount Type**: TOTAL
- **Movement**: DEBIT
- **Account**: (Customer account - passed as parameter)
- **Fixed Amount**: (empty)
- **Rate**: (empty)
- **Descripción**: Cargo total al cliente

---

#### Line2 - Commission Income (COMMISSION)
- **Rule Name**: RuleLC_Imp_CommCharge_Line2
- **Line Number**: Line2
- **Amount Type**: COMMISSION
- **Movement**: CREDIT
- **Account**: 520500300000000000 - COMMISSION INCOME - LC IMPORT
- **Fixed Amount**: (empty - uses parameter)
- **Rate**: (empty)
- **Taxable (Column N)**: **False** (NOT subject to VAT)
- **Descripción**: Ingreso por comisión (variable según LC)

---

#### Line3 - SWIFT Message Fee (SWIFT_FEE) ✅
- **Rule Name**: RuleLC_Imp_CommCharge_Line3
- **Line Number**: Line3
- **Amount Type**: SWIFT_FEE
- **Movement**: CREDIT
- **Account**: 559004600000000000 - SWIFT MESSAGE SERVICE FEE
- **Fixed Amount (Column L)**: **25.00** ✅
- **Rate**: (empty)
- **Taxable (Column N)**: **True** ✅ (INCLUDED in VAT base)
- **Descripción**: Cargo fijo por mensaje SWIFT

---

#### Line4 - Postage Service Fee (POSTAGE) ✅
- **Rule Name**: RuleLC_Imp_CommCharge_Line4
- **Line Number**: Line4
- **Amount Type**: POSTAGE
- **Movement**: CREDIT
- **Account**: 559005300000000000 - POSTAGE SERVICE FEE
- **Fixed Amount (Column L)**: **15.00** ✅
- **Rate**: (empty)
- **Taxable (Column N)**: **True** ✅ (INCLUDED in VAT base)
- **Descripción**: Cargo fijo por servicio de correspondencia

---

#### Line5 - VAT on Services (VAT) ✅
- **Rule Name**: RuleLC_Imp_CommCharge_Line5
- **Line Number**: Line5
- **Amount Type**: VAT
- **Movement**: CREDIT
- **Account**: 250405050010000000 - VAT ON SERVICES
- **Fixed Amount**: (empty)
- **Rate (Column M)**: **0.15** ✅
- **Taxable (Column N)**: **False** (not taxable itself)
- **Descripción**: IVA 15% sobre cargos marcados como gravables
- **Fórmula NUEVA (V4.0)**: `(Sum of all charges where Taxable=True) × 0.15`
- **Fórmula Anterior (V3.2)**: ~~`(Account_559004600000000000 + Account_559005300000000000) × 0.15`~~ (hardcoded)
- **Mejora**: Ahora completamente flexible - cada país configura qué cargos son gravables

---

## Ejemplo de Cálculo

Con la configuración actual:

```
Commission (variable):  $500.00  (from parameter)
SWIFT Fee (fixed):      $ 25.00  (from Excel Column L - Account 559004600000000000)
Postage Fee (fixed):    $ 15.00  (from Excel Column L - Account 559005300000000000)
─────────────────────────────────────────────────────────────────────────────────
Subtotal for VAT:       $ 40.00  ($25.00 + $15.00)

VAT Rate (from Excel):   0.15    (from Excel Column M - 15%)
VAT Calculation:         (Account_559004600000000000 + Account_559005300000000000) × 0.15
                       = ($25.00 + $15.00) × 0.15
                       = $40.00 × 0.15
VAT Amount:             $  6.00  (Account 250405050010000000)
─────────────────────────────────────────────────────────────────────────────────
TOTAL DEBIT:            $546.00
```

### Asiento Contable Resultante:

| Tipo   | Cuenta                  | Descripción              | Monto   |
|--------|-------------------------|--------------------------|---------|
| DEBIT  | 210201001012345678      | Customer Account         | $546.00 |
| CREDIT | 520500300000000000      | Commission Income        | $500.00 |
| CREDIT | 559004600000000000      | SWIFT Message Service    | $ 25.00 |
| CREDIT | 559005300000000000      | Postage Service          | $ 15.00 |
| CREDIT | 250405050010000000      | VAT 15%                  | $  6.00 |
|        |                         | **TOTAL**                | $546.00 |

✅ **Balance verificado**: Débito = Crédito

---

## Cómo Modificar la Configuración

### Para cambiar el cargo de SWIFT:
1. Abrir `configuracionContable.xls`
2. Buscar regla: `RuleLC_Imp_CommCharge_Line3`
3. Modificar **Column L** (ejemplo: "30.00" para $30)
4. Guardar y recargar reglas

### Para cambiar el cargo de Postage:
1. Abrir `configuracionContable.xls`
2. Buscar regla: `RuleLC_Imp_CommCharge_Line4`
3. Modificar **Column L** (ejemplo: "20.00" para $20)
4. Guardar y recargar reglas

### Para cambiar la tasa de IVA:
1. Abrir `configuracionContable.xls`
2. Buscar regla: `RuleLC_Imp_CommCharge_Line5`
3. Modificar **Column M** (ejemplo: "0.16" para 16%)
4. Guardar y recargar reglas

### Para configurar qué cargos son gravables (NEW V4.0): 🌍
1. Abrir `configuracionContable.xls`
2. Buscar las reglas: `RuleLC_Imp_CommCharge_Line2`, `Line3`, `Line4`
3. Modificar **Column N** (True/False) para cada cargo
   - True = Cargo INCLUIDO en base gravable
   - False = Cargo NO gravable
4. Ejemplo México (IVA en TODO): Todas las líneas = True
5. Ejemplo UK (VAT solo SWIFT): Line3 = True, otros = False
6. Guardar y recargar reglas

---

## Archivos Relacionados

### Código Java:
- `AccountingConfigurationService.java` - Lee las reglas de Drools
- `CompositeEntryService.java` - Genera el asiento compuesto
- `AccountingConfiguration.java` - Modelo con campos `fixedAmount` y `rate`

### Configuración:
- `configuracionContable.xls` - Archivo de reglas Drools (ACTUALIZADO)
- `configuracionContable_backup.xls` - Respaldo del archivo original

### Documentación:
- `README-ConfiguracionContable.md` - Documentación completa
- `composite-entry-example.java` - Ejemplo de uso
- `accounting-configuration-drools-example.java` - Servicio de configuración

---

## Backup

Se creó un backup automático del archivo original:

📁 **Ubicación**: `configuracionContable_backup.xls`

En caso de necesitar restaurar el archivo original, simplemente renombrar el backup.

---

## Versión del Sistema

**Version**: 4.0 🌍
**Date**: 2025-11-18 23:00
**Total Rules**: 31
**Total Columns**: 14 (A-N)

**BREAKING CHANGE in V4.0**:
- ✅ Column N (Taxable) - **FULLY FLEXIBLE VAT CALCULATION**
- ✅ Multi-country support - each country configures tax rules
- ✅ NO hardcoded tax formulas in Java
- ✅ Regulatory compliance - easy to adapt to tax law changes

**Previous Features**:
- ✅ Column L (Fixed Amount) - Montos fijos configurables
- ✅ Column M (Rate) - Tasas porcentuales configurables
- ✅ 100% parametrizable desde Excel
- ✅ Sin valores hardcoded en código Java

---

## Próximos Pasos

El sistema está completamente configurado y listo para uso. Para probar:

1. **Reiniciar la aplicación** para cargar las nuevas reglas
2. **Ejecutar el método de ejemplo**:
   ```java
   CompositeEntryService service = ...;
   AccountingEntry entry = service.generateLCImportCommissionCharge(
       "210201001012345678",  // Customer account
       new BigDecimal("500.00"),  // Commission
       new BigDecimal("0.00"),    // Postage (ignored, uses Excel value)
       "LC-IMP-2025-001"      // Reference
   );
   ```

3. **Verificar el resultado**:
   - Total debe ser $546.00
   - SWIFT Fee debe ser $25.00 (desde Excel)
   - Postage debe ser $15.00 (desde Excel)
   - VAT debe ser $6.00 (15% de $40)

---

**✅ Configuración completada exitosamente**
