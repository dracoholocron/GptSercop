# Mensajes SWIFT para Comercio Exterior

## Categoría 4 - Cobranzas Documentarias (MT4xx)

### MT400 - Aviso de Cobranza
**Descripción**: Mensaje enviado por el banco del exportador al banco del importador para avisar de una cobranza documentaria.
**Uso**: Inicio del proceso de cobranza
**Partes**: Banco remitente → Banco cobrador
**Eventos típicos**: EMISION

### MT410 - Acuse de Recibo de Cobranza
**Descripción**: Confirmación de recepción de la cobranza por parte del banco cobrador.
**Uso**: Confirmar recepción de documentos
**Partes**: Banco cobrador → Banco remitente
**Eventos típicos**: RECEPCION

### MT412 - Aviso de Aceptación
**Descripción**: Notificación de que el importador ha aceptado los documentos de la cobranza.
**Uso**: Confirmar aceptación por parte del importador
**Partes**: Banco cobrador → Banco remitente
**Eventos típicos**: ACEPTACION

### MT416 - Aviso de Pago
**Descripción**: Notificación de que el pago de la cobranza ha sido efectuado.
**Uso**: Confirmar pago realizado
**Partes**: Banco cobrador → Banco remitente
**Eventos típicos**: PAGO

### MT420 - Rastreo de Cobranza
**Descripción**: Solicitud de información sobre el estado de una cobranza.
**Uso**: Seguimiento de cobranza
**Partes**: Banco remitente → Banco cobrador
**Eventos típicos**: RASTREO

---

## Categoría 7 - Créditos Documentarios (MT7xx)

### MT700 - Emisión de Carta de Crédito
**Descripción**: Emisión de una carta de crédito documentaria.
**Uso**: Apertura de crédito documentario
**Partes**: Banco emisor → Banco avisador/confirmador
**Eventos típicos**: EMISION
**Importancia**: ⭐⭐⭐⭐⭐ (Mensaje más común en comercio exterior)

### MT701 - Emisión de Carta de Crédito Stand-by
**Descripción**: Emisión de una carta de crédito stand-by (garantía de pago).
**Uso**: Apertura de stand-by letter of credit
**Partes**: Banco emisor → Banco avisador
**Eventos típicos**: EMISION
**Importancia**: ⭐⭐⭐⭐

### MT707 - Modificación de Carta de Crédito
**Descripción**: Modificación de los términos de una carta de crédito existente.
**Uso**: Cambios en condiciones del crédito
**Partes**: Banco emisor → Banco avisador
**Eventos típicos**: MODIFICACION
**Importancia**: ⭐⭐⭐⭐

### MT710 - Aviso de Carta de Crédito de Tercero
**Descripción**: Aviso de una carta de crédito emitida por otro banco.
**Uso**: Notificar crédito emitido por tercero
**Partes**: Banco avisador → Beneficiario
**Eventos típicos**: AVISO
**Importancia**: ⭐⭐⭐⭐

### MT711 - Aviso de Carta de Crédito Stand-by de Tercero
**Descripción**: Aviso de una carta de crédito stand-by emitida por otro banco.
**Uso**: Notificar stand-by emitido por tercero
**Partes**: Banco avisador → Beneficiario
**Eventos típicos**: AVISO
**Importancia**: ⭐⭐⭐

### MT720 - Transferencia de Carta de Crédito
**Descripción**: Transferencia total o parcial de una carta de crédito transferible.
**Uso**: Ceder derechos de un crédito transferible
**Partes**: Banco transferidor → Segundo beneficiario
**Eventos típicos**: TRANSFERENCIA
**Importancia**: ⭐⭐⭐

### MT730 - Acuse de Recibo
**Descripción**: Confirmación de recepción de un mensaje de crédito documentario.
**Uso**: Acusar recibo de MT700, MT707, etc.
**Partes**: Banco receptor → Banco emisor
**Eventos típicos**: RECEPCION
**Importancia**: ⭐⭐

### MT732 - Aviso de Incumplimiento/Rechazo
**Descripción**: Notificación de que no se aceptan los términos de un crédito o modificación.
**Uso**: Rechazar condiciones
**Partes**: Banco avisador → Banco emisor
**Eventos típicos**: RECHAZO
**Importancia**: ⭐⭐⭐

### MT734 - Aviso de Renuncia
**Descripción**: Notificación de que el beneficiario renuncia a un crédito o modificación.
**Uso**: Rechazar crédito por parte del beneficiario
**Partes**: Banco avisador → Banco emisor
**Eventos típicos**: RENUNCIA
**Importancia**: ⭐⭐

### MT740 - Autorización para Reembolsar
**Descripción**: Autorización del banco emisor para que otro banco reembolse.
**Uso**: Instrucciones de reembolso
**Partes**: Banco emisor → Banco reembolsador
**Eventos típicos**: AUTORIZACION
**Importancia**: ⭐⭐⭐⭐

### MT742 - Reclamación de Reembolso
**Descripción**: Solicitud de reembolso por parte del banco nominado/confirmador.
**Uso**: Solicitar reembolso de pago efectuado
**Partes**: Banco nominado → Banco reembolsador
**Eventos típicos**: RECLAMACION
**Importancia**: ⭐⭐⭐⭐

### MT747 - Modificación de Carta de Crédito
**Descripción**: Variante del MT707 para modificaciones específicas.
**Uso**: Cambios en condiciones del crédito
**Partes**: Banco emisor → Banco avisador
**Eventos típicos**: MODIFICACION
**Importancia**: ⭐⭐⭐⭐

### MT750 - Aviso de Discrepancia
**Descripción**: Notificación de discrepancias encontradas en los documentos presentados.
**Uso**: Reportar discrepancias documentales
**Partes**: Banco nominado → Banco emisor
**Eventos típicos**: DISCREPANCIA
**Importancia**: ⭐⭐⭐⭐

### MT752 - Autorización para Pagar/Aceptar/Negociar
**Descripción**: Autorización del banco emisor para proceder con pago/aceptación/negociación.
**Uso**: Autorizar operación tras resolver discrepancias
**Partes**: Banco emisor → Banco nominado
**Eventos típicos**: AUTORIZACION
**Importancia**: ⭐⭐⭐⭐

### MT754 - Aviso de Pago/Aceptación
**Descripción**: Notificación de que se ha efectuado el pago o aceptación bajo el crédito.
**Uso**: Confirmar pago/aceptación realizada
**Partes**: Banco nominado → Banco emisor
**Eventos típicos**: PAGO
**Importancia**: ⭐⭐⭐⭐⭐

### MT756 - Aviso de Reembolso
**Descripción**: Notificación de que el reembolso ha sido efectuado.
**Uso**: Confirmar reembolso realizado
**Partes**: Banco reembolsador → Banco nominado
**Eventos típicos**: REEMBOLSO
**Importancia**: ⭐⭐⭐⭐

---

## Categoría 7 - Garantías Bancarias (MT7xx)

### MT760 - Garantía Bancaria
**Descripción**: Emisión de una garantía bancaria (bid bond, performance bond, etc.).
**Uso**: Emitir garantía a favor de un beneficiario
**Partes**: Banco emisor → Banco avisador/beneficiario
**Eventos típicos**: EMISION
**Importancia**: ⭐⭐⭐⭐⭐

**Tipos de Garantías**:
- Bid Bond (Garantía de oferta)
- Performance Bond (Garantía de cumplimiento)
- Advance Payment Guarantee (Garantía de anticipo)
- Retention Money Guarantee (Garantía de retención)

### MT767 - Modificación de Garantía
**Descripción**: Modificación de los términos de una garantía bancaria existente.
**Uso**: Cambiar condiciones de la garantía
**Partes**: Banco emisor → Banco avisador
**Eventos típicos**: MODIFICACION
**Importancia**: ⭐⭐⭐⭐

---

## Mensajes Adicionales

### MT799 - Mensaje de Texto Libre entre Bancos
**Descripción**: Mensaje de texto libre para comunicación entre bancos sobre operaciones de comercio exterior.
**Uso**: Consultas, aclaraciones, coordinación
**Partes**: Banco → Banco
**Eventos típicos**: CONSULTA
**Importancia**: ⭐⭐⭐

---

## Flujo Típico de Operaciones

### Flujo de Carta de Crédito (Letter of Credit)

```
1. MT700 (Emisión)
   Banco Emisor → Banco Avisador

2. MT710 (Aviso al beneficiario)
   Banco Avisador → Beneficiario

3. [Presentación de documentos]
   Beneficiario → Banco Nominado

4a. Si todo OK:
    MT754 (Aviso de Pago)
    Banco Nominado → Banco Emisor

4b. Si hay discrepancias:
    MT750 (Aviso de Discrepancia)
    Banco Nominado → Banco Emisor

    MT752 (Autorización para Pagar)
    Banco Emisor → Banco Nominado

5. MT742 (Reclamación de Reembolso)
   Banco Nominado → Banco Reembolsador

6. MT756 (Aviso de Reembolso)
   Banco Reembolsador → Banco Nominado

Modificaciones:
MT707/MT747 (en cualquier momento antes de pago)
```

### Flujo de Cobranza Documentaria (Documentary Collection)

```
1. MT400 (Aviso de Cobranza)
   Banco Remitente → Banco Cobrador

2. MT410 (Acuse de Recibo)
   Banco Cobrador → Banco Remitente

3a. Si es D/A (Documents Against Acceptance):
    MT412 (Aviso de Aceptación)
    Banco Cobrador → Banco Remitente

3b. Si es D/P (Documents Against Payment):
    MT416 (Aviso de Pago)
    Banco Cobrador → Banco Remitente

Seguimiento:
MT420 (Rastreo) en cualquier momento
```

### Flujo de Garantía Bancaria (Bank Guarantee)

```
1. MT760 (Emisión de Garantía)
   Banco Emisor → Beneficiario/Banco Avisador

2. MT730 (Acuse de Recibo)
   Banco Avisador → Banco Emisor

Modificaciones:
MT767 (Modificación de Garantía)
Banco Emisor → Beneficiario/Banco Avisador
```

---

## Matriz de Comisiones Típicas

| Tipo de Operación | Mensaje Principal | Rango de Comisión | Base de Cálculo |
|-------------------|-------------------|-------------------|-----------------|
| Carta de Crédito Emisión | MT700 | 0.15% - 0.30% | Monto del crédito |
| Carta de Crédito Aviso | MT710 | 0.10% - 0.20% | Monto del crédito |
| Carta de Crédito Confirmación | MT700+Confirm | 0.25% - 0.50% | Monto del crédito |
| Modificación de L/C | MT707/MT747 | $100 - $300 | Flat fee |
| Stand-by Letter of Credit | MT701 | 0.20% - 0.40% | Monto anual |
| Garantía Bancaria | MT760 | 0.10% - 0.25% | Monto anual |
| Cobranza Simple | MT400 | $80 - $150 | Flat fee |
| Cobranza Documentaria | MT400 | 0.15% - 0.35% | Monto de cobranza |
| Reembolso | MT742 | 0.08% - 0.15% | Monto reembolsado |

---

## Eventos del Ciclo de Vida

Cada tipo de mensaje puede tener diferentes eventos asociados:

| Evento | Descripción | Mensajes Típicos |
|--------|-------------|------------------|
| **EMISION** | Emisión inicial del instrumento | MT700, MT701, MT760 |
| **AVISO** | Aviso a las partes involucradas | MT710, MT711 |
| **RECEPCION** | Confirmación de recepción | MT410, MT730 |
| **ACEPTACION** | Aceptación de la operación | MT412 |
| **PAGO** | Ejecución del pago | MT416, MT754 |
| **MODIFICACION** | Cambios en el instrumento | MT707, MT747, MT767 |
| **AUTORIZACION** | Autorización de operación | MT740, MT752 |
| **RECLAMACION** | Solicitud de reembolso | MT742 |
| **DISCREPANCIA** | Notificación de problemas | MT750 |
| **RECHAZO** | Rechazo de la operación | MT732 |
| **RENUNCIA** | Renuncia a derechos | MT734 |
| **REEMBOLSO** | Devolución de fondos | MT756 |
| **TRANSFERENCIA** | Transferencia de derechos | MT720 |
| **RASTREO** | Seguimiento de operación | MT420 |
| **CONSULTA** | Consultas entre bancos | MT799 |

---

## Referencias

- **SWIFT Standards**: ISO 15022
- **Uniform Customs and Practice for Documentary Credits (UCP)**: ICC Publication 600
- **Uniform Rules for Collections (URC)**: ICC Publication 522
- **Uniform Rules for Demand Guarantees (URDG)**: ICC Publication 758
