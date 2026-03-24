-- ================================================
-- Migration: Add documentation_url to SWIFT field configurations
-- Description: Populate documentation_url field with detailed field descriptions
-- Author: GlobalCMX Architecture
-- Date: 2025-12-02
-- ================================================

-- MT700 - Issue of a Documentary Credit
-- SECTION: BASICA (Basic Information)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Referencia del Remitente (Sender''s Reference)

Descripción:
Campo OBLIGATORIO que contiene la referencia única del mensaje SWIFT asignada por el emisor.

Formato:
- Máximo 16 caracteres alfanuméricos
- Sin espacios
- Caracteres permitidos: A-Z, 0-9, /, -, ?, :, (, ), ., ,, '', +

Ejemplos:
- LC2024001234
- ME0001250023
- IMPORT/LC/001

Importante:
- Esta referencia debe ser ÚNICA para cada mensaje enviado
- Se utiliza para rastrear y referenciar el mensaje
- Requerido en todas las comunicaciones subsecuentes relacionadas con esta LC'
WHERE field_code = ':20:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Reglas Aplicables (Applicable Rules)

Descripción:
Campo OBLIGATORIO que especifica las reglas internacionales que rigen el crédito documentario.

Opciones estándar:
- UCP LATEST VERSION - Reglas UCP 600 de la ICC (International Chamber of Commerce)
- EUCP LATEST VERSION - Reglas eUCP para presentación electrónica
- EUCPURR LATEST VERSION - Reglas eUCP con URR (Uniform Rules for Reimbursement)
- OTHR - Otras reglas (especificar en campo adicional)

Formato:
- Texto fijo según las opciones disponibles
- Máximo 35 caracteres por línea (hasta 3 líneas)

Estándar más común:
UCP 600 es el estándar más utilizado internacionalmente para cartas de crédito documentarias.

Referencia:
ICC Publication No. 600 - Uniform Customs and Practice for Documentary Credits'
WHERE field_code = ':40E:' AND message_type = 'MT700';

-- SECTION: PARTES (Parties)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Ordenante / Applicant

Descripción:
Campo OBLIGATORIO que identifica al cliente que solicita la emisión del crédito documentario (el importador).

Formato:
Máximo 4 líneas de 35 caracteres cada una:
Línea 1: Nombre completo o razón social
Línea 2: Dirección (calle y número)
Línea 3: Ciudad
Línea 4: País

Información requerida:
- Nombre completo sin abreviaturas
- Dirección completa y válida
- Debe coincidir con la documentación del banco

Ejemplo:
ABC IMPORT COMPANY S.A.
AV. REFORMA 456
CIUDAD DE MEXICO
MEXICO

Nota importante:
El ordenante es el cliente del banco emisor y es quien asume la obligación de pagar bajo los términos del crédito.'
WHERE field_code = ':50:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Beneficiario / Beneficiary

Descripción:
Campo OBLIGATORIO que identifica al exportador que recibirá el pago bajo el crédito documentario.

Formato:
Máximo 4 líneas de 35 caracteres cada una:
Línea 1: Nombre completo o razón social
Línea 2: Dirección (calle y número)
Línea 3: Ciudad
Línea 4: País

Información requerida:
- Nombre exacto del beneficiario
- Dirección completa
- Debe coincidir con los documentos de exportación
- Debe coincidir con la factura comercial

Ejemplo:
XYZ EXPORT LIMITED
123 EXPORT STREET
LONDON
UNITED KINGDOM

Nota importante:
Solo el beneficiario nombrado puede presentar documentos bajo este crédito. Los datos deben ser exactos para evitar discrepancias.'
WHERE field_code = ':59:' AND message_type = 'MT700';

-- SECTION: TERMINOS (Terms and Conditions)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Forma del Crédito Documentario (Form of Documentary Credit)

Descripción:
Campo OBLIGATORIO que especifica si el crédito es revocable o irrevocable.

Opciones:
- IRREVOCABLE: El crédito NO puede ser modificado o cancelado sin el consentimiento de todas las partes (RECOMENDADO)
- REVOCABLE: El crédito puede ser modificado o cancelado por el banco emisor sin previo aviso al beneficiario (RARO)

Formato:
- Código fijo de acuerdo a las opciones
- Máximo 16 caracteres

Estándar:
Según UCP 600, todos los créditos son IRREVOCABLES por defecto. Los créditos revocables prácticamente no se usan en el comercio internacional moderno.

Importante:
Un crédito IRREVOCABLE proporciona seguridad al beneficiario de que el pago será realizado si cumple con todos los términos y condiciones.'
WHERE field_code = ':40A:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Banco Disponible / Available With Bank

Descripción:
Campo opcional que designa el banco donde el crédito está disponible para pago, aceptación o negociación.

Formato:
Opción A: Código BIC/SWIFT de 8 u 11 caracteres
Opción D: Nombre y dirección (máximo 4 líneas de 35 caracteres)

Ejemplo BIC:
WFBIUS6WXXX

Ejemplo Nombre:
WELLS FARGO BANK NA
420 MONTGOMERY STREET
SAN FRANCISCO CA 94104
UNITED STATES

Tipo de disponibilidad:
- BY PAYMENT: Pago a la vista
- BY ACCEPTANCE: Aceptación de giros
- BY NEGOTIATION: Negociación de documentos
- BY DEFERRED PAYMENT: Pago diferido

Nota:
Si no se especifica, el crédito está disponible con el banco emisor.'
WHERE field_code = ':41a:' AND message_type = 'MT700';

-- SECTION: MONTOS (Amounts and Currency)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Moneda y Monto del Crédito (Currency Code, Amount)

Descripción:
Campo OBLIGATORIO que especifica la moneda y el monto máximo del crédito documentario.

Formato:
- 3 caracteres para código de moneda (ISO 4217)
- Seguido del monto numérico (máximo 15 dígitos)
- Formato: CCCnnnnnnnnnn (sin coma decimal)

Ejemplos:
- USD100000,00 (Cien mil dólares estadounidenses)
- EUR50000,00 (Cincuenta mil euros)
- GBP25000,00 (Veinticinco mil libras esterlinas)

Códigos de moneda comunes:
- USD: Dólar estadounidense
- EUR: Euro
- GBP: Libra esterlina
- JPY: Yen japonés
- CHF: Franco suizo
- CAD: Dólar canadiense
- MXN: Peso mexicano

Importante:
- El monto debe expresarse sin símbolos monetarios
- La coma decimal se usa según estándar europeo (,)
- Este es el monto MÁXIMO disponible bajo el crédito'
WHERE field_code = ':32B:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Tolerancia de Cantidad y Monto (Percentage Credit Amount Tolerance)

Descripción:
Campo opcional que permite especificar un porcentaje de tolerancia sobre el monto y/o cantidad del crédito.

Formato:
- Formato: nn/nn (dos cifras / dos cifras)
- Primer valor: Tolerancia POSITIVA (aumento permitido)
- Segundo valor: Tolerancia NEGATIVA (disminución permitida)

Ejemplos:
- 10/10: ±10% de tolerancia en monto y cantidad
- 05/05: ±5% de tolerancia
- 10/00: +10% de aumento, sin disminución
- 00/10: Sin aumento, -10% de disminución

Aplicación:
Esta tolerancia se aplica tanto al:
1. Monto total del crédito
2. Cantidad de mercancías (si está especificada)

Según UCP 600:
Si no se especifica tolerancia, se permite una tolerancia automática de ±5% en el monto del crédito, SALVO cuando:
- La cantidad está expresada en unidades o pesos específicos
- Se usa la palabra "circa" o "approximately"

Nota importante:
La tolerancia NO se aplica cuando el crédito especifica un monto máximo que no debe excederse.'
WHERE field_code = ':39A:' AND message_type = 'MT700';

-- SECTION: FECHAS (Dates)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Fecha de Emisión (Date of Issue)

Descripción:
Campo OBLIGATORIO que indica la fecha en que el crédito documentario es emitido por el banco.

Formato:
YYMMDD (6 dígitos)
- YY: Año (dos últimos dígitos)
- MM: Mes (01-12)
- DD: Día (01-31)

Ejemplos:
- 251202: 2 de diciembre de 2025
- 250615: 15 de junio de 2025

Importante:
- Esta es la fecha desde la cual el crédito es efectivo
- Debe ser una fecha válida en el calendario
- Normalmente es la fecha del día en que se envía el mensaje
- El beneficiario puede presentar documentos desde esta fecha

Nota:
La fecha de emisión debe ser igual o anterior a la fecha de vencimiento del crédito.'
WHERE field_code = ':31C:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Fecha de Vencimiento (Date of Expiry)

Descripción:
Campo OBLIGATORIO que especifica la fecha límite hasta la cual el beneficiario puede presentar los documentos.

Formato:
YYMMDD (6 dígitos)
- YY: Año (dos últimos dígitos)
- MM: Mes (01-12)
- DD: Día (01-31)

Ejemplos:
- 260131: 31 de enero de 2026
- 251231: 31 de diciembre de 2025

Importante:
- Los documentos deben presentarse EN O ANTES de esta fecha
- Después de esta fecha, el crédito expira automáticamente
- Debe incluir también el LUGAR de vencimiento
- Es responsabilidad del beneficiario presentar los documentos a tiempo

Extensiones:
- Si la fecha de vencimiento cae en un día no hábil bancario, se extiende automáticamente al siguiente día hábil
- Las extensiones deben solicitarse mediante enmienda (MT707) antes del vencimiento

Nota crítica:
Una presentación después de la fecha de vencimiento constituye una discrepancia que puede resultar en el rechazo de los documentos.'
WHERE field_code = ':31D:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Fecha Límite de Embarque (Latest Date of Shipment)

Descripción:
Campo opcional que especifica la fecha límite para embarcar las mercancías.

Formato:
YYMMDD (6 dígitos)
- YY: Año (dos últimos dígitos)
- MM: Mes (01-31)
- DD: Día (01-31)

Ejemplos:
- 251215: 15 de diciembre de 2025
- 260101: 1 de enero de 2026

Importante:
- Los documentos de transporte deben mostrar una fecha de embarque igual o anterior a esta fecha
- "Embarque" significa la carga de mercancías a bordo del medio de transporte
- Si no se especifica, el último día de embarque es la fecha de vencimiento del crédito

Terminología según tipo de transporte:
- Transporte marítimo: "on board date" (fecha a bordo)
- Transporte aéreo: "flight date" (fecha de vuelo)
- Transporte terrestre: "dispatch date" (fecha de despacho)
- Courier: "pickup date" (fecha de recogida)

Nota:
Los términos como "prompt", "immediately", "as soon as possible" NO son aceptables bajo UCP 600. Debe especificarse una fecha concreta.'
WHERE field_code = ':44C:' AND message_type = 'MT700';

-- SECTION: BANCOS (Banks)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Banco Notificador / Advising Bank

Descripción:
Campo opcional que identifica el banco que notifica el crédito al beneficiario (normalmente un banco en el país del beneficiario).

Formato:
Opción A: Código BIC/SWIFT (8 u 11 caracteres)
Opción D: Nombre y dirección completa (máximo 4 líneas x 35 caracteres)

Ejemplo BIC:
BOFAUS3NXXX

Ejemplo Nombre:
BANK OF AMERICA N.A.
222 BROADWAY
NEW YORK NY 10038
UNITED STATES OF AMERICA

Funciones del banco notificador:
- Autenticar el crédito y notificarlo al beneficiario
- NO tiene obligación de pagar (a menos que lo confirme)
- Verificar que el mensaje proviene del banco emisor
- Actuar como intermediario entre emisor y beneficiario

Banco Notificador vs Banco Confirmador:
- Notificador: Solo informa, sin compromiso de pago
- Confirmador: Agrega su compromiso de pago (campo :49:)

Nota:
El banco notificador debe tomar medidas razonables para verificar la autenticidad aparente del crédito que notifica.'
WHERE field_code = ':57a:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Banco Intermediario / Intermediary Bank

Descripción:
Campo opcional que identifica un banco intermediario en la cadena de bancos participantes en el crédito.

Formato:
Opción A: Código BIC/SWIFT (8 u 11 caracteres)
Opción D: Nombre y dirección completa (máximo 4 líneas x 35 caracteres)

Ejemplo BIC:
CHASUS33XXX

Ejemplo Nombre:
JPMORGAN CHASE BANK N.A.
383 MADISON AVENUE
NEW YORK NY 10179
UNITED STATES OF AMERICA

Función del banco intermediario:
- Facilitar la transferencia de fondos entre bancos
- Actuar como corresponsal bancario
- Procesar pagos internacionales
- NO tiene obligaciones directas bajo el crédito

Uso común:
Se especifica cuando el banco emisor no tiene relación de corresponsalía directa con el banco del beneficiario y requiere un intermediario para el procesamiento de pagos.

Nota:
El banco intermediario cobra comisiones por sus servicios, que deben ser consideradas en los términos del crédito (ver campo :71B: - Charges).'
WHERE field_code = ':56a:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Banco Beneficiario / Beneficiary Bank

Descripción:
Campo opcional que identifica el banco del beneficiario donde se acreditarán los fondos tras el pago.

Formato:
Opción A: Código BIC/SWIFT (8 u 11 caracteres)
Opción D: Nombre y dirección completa (máximo 4 líneas x 35 caracteres)

Ejemplo BIC:
HSBCGB2LXXX

Ejemplo Nombre:
HSBC BANK PLC
8 CANADA SQUARE
LONDON E14 5HQ
UNITED KINGDOM

Función:
- Banco donde el beneficiario mantiene su cuenta
- Recibe los fondos tras la conformidad de los documentos
- Puede ser el mismo banco que el banco notificador/confirmador o diferente

Instrucciones de pago:
Este campo es parte de las instrucciones de pago y debe incluirse cuando:
- Se especifica una cuenta bancaria para crédito
- El pago debe hacerse a través de un banco específico
- Se requiere identificación clara de la institución receptora

Nota:
Los detalles de la cuenta del beneficiario (número de cuenta) se especifican en el campo :59: junto con los datos del beneficiario, o en instrucciones de pago especiales.'
WHERE field_code = ':58a:' AND message_type = 'MT700';

-- SECTION: TRANSPORTE (Shipment and Transport)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Puerto de Embarque / Place of Taking in Charge

Descripción:
Campo opcional que especifica el lugar desde donde se embarcan o toman a cargo las mercancías.

Formato:
Máximo 65 caracteres (una línea)

Ejemplos:
- VERACRUZ PORT, MEXICO
- SHANGHAI, CHINA
- ANY PORT IN JAPAN
- LOS ANGELES, CALIFORNIA, USA

Información incluida:
- Nombre del puerto o ciudad
- País (recomendado para evitar ambigüedades)
- Puede especificarse un rango: "ANY PORT IN [COUNTRY]"
- Puede especificarse "ANY EUROPEAN PORT"

Relación con Incoterms:
Este campo debe coordinarse con el Incoterm especificado en el crédito:
- FOB: Puerto de embarque es crítico (punto de transferencia de riesgo)
- CIF/CFR: Puerto de embarque + destino requeridos
- EXW: Puede especificar dirección del vendedor

Nota importante:
Los documentos de transporte deben mostrar este puerto/lugar como punto de partida o de toma a cargo. Discrepancias pueden resultar en rechazo de documentos.'
WHERE field_code = ':44E:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Puerto de Destino / Port of Discharge

Descripción:
Campo opcional que especifica el lugar donde las mercancías deben ser descargadas o entregadas.

Formato:
Máximo 65 caracteres (una línea)

Ejemplos:
- NEW YORK, USA
- HAMBURG, GERMANY
- ANY PORT IN UNITED KINGDOM
- ROTTERDAM, NETHERLANDS

Información incluida:
- Nombre del puerto o ciudad de destino
- País (recomendado)
- Puede especificarse un rango geográfico
- Puede incluir alternativas separadas por "/"

Relación con Incoterms:
- CIF/CFR/CIP: Puerto de destino es OBLIGATORIO
- FOB/FCA: Puerto de destino es referencial
- DDP/DAP: Debe especificar dirección exacta de entrega

Transbordos:
Si se permite transbordo (campo :43P:), el documento de transporte puede mostrar puertos intermedios, pero el destino final debe coincidir con este campo.

Documentación:
El Bill of Lading (B/L) o documento de transporte debe mostrar este puerto como:
- "Port of Discharge" (transporte marítimo)
- "Place of Delivery" (transporte multimodal)
- "Airport of Destination" (transporte aéreo)

Nota crítica:
Discrepancias en el puerto de destino son una de las causas más comunes de rechazo de documentos bajo créditos documentarios.'
WHERE field_code = ':44F:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Embarques Parciales (Partial Shipments)

Descripción:
Campo opcional que indica si se permiten o prohíben embarques parciales de las mercancías.

Opciones:
- ALLOWED: Embarques parciales permitidos
- CONDITIONAL: Permitidos bajo ciertas condiciones (especificar en :47A:)
- NOT ALLOWED: Embarques parciales NO permitidos
- (vacío): Si no se especifica, se consideran PERMITIDOS según UCP 600

Formato:
Código fijo según las opciones (máximo 12 caracteres)

Definición según UCP 600:
"Embarques parciales" significa el embarque de una parte de la cantidad total de mercancías especificadas en el crédito, desde uno o más lugares de embarque.

Ejemplos de uso:
1. ALLOWED: El beneficiario puede embarcar la mercancía en varios envíos
2. NOT ALLOWED: Toda la mercancía debe embarcarse en un solo envío

Consideraciones:
- Si se permiten embarques parciales, cada embarque requiere su propia presentación de documentos
- Cada set de documentos puede negociarse independientemente
- Los embarques parciales pueden tener diferentes fechas de embarque (dentro del plazo límite)

Relación con transbordo:
Embarques parciales ≠ Transbordo
- Embarques parciales: División de la mercancía en varios envíos
- Transbordo (campo :43T:): Cambio de medio de transporte durante el trayecto

Nota importante:
Si el crédito prohíbe embarques parciales pero los documentos muestran múltiples embarques, constituye una discrepancia.'
WHERE field_code = ':43P:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Transbordo (Transhipment)

Descripción:
Campo opcional que indica si se permite o prohíbe el transbordo durante el transporte.

Opciones:
- ALLOWED: Transbordo permitido
- CONDITIONAL: Permitido bajo ciertas condiciones (especificar)
- NOT ALLOWED: Transbordo NO permitido
- (vacío): Si no se especifica, se considera PERMITIDO según UCP 600

Formato:
Código fijo según las opciones (máximo 12 caracteres)

Definición según UCP 600:
"Transbordo" significa la descarga de mercancías de un medio de transporte y su recarga en otro medio de transporte (del mismo o diferente modo de transporte) durante el viaje desde el puerto/lugar de embarque hasta el puerto/lugar de destino.

Ejemplos de transbordo:
1. Buque → Buque diferente (mismo puerto)
2. Buque → Tren → Camión (transporte multimodal)
3. Vuelo con escala técnica (SIN descargar mercancía) = NO es transbordo

Según tipo de documento de transporte:
- Bill of Lading (B/L) marítimo: Transbordo debe estar indicado si ocurre
- Airway Bill (AWB): Transbordo no aplica (traslados de aerolínea son normales)
- Documento multimodal: Transbordo es inherente al proceso

Consideraciones:
- Si el transbordo está PROHIBIDO, el documento debe mostrar transporte directo
- Si hay transbordo cuando está prohibido = DISCREPANCIA
- El puerto de transbordo NO necesita ser mencionado si el transbordo está permitido

Nota importante:
Los bancos verificarán que el documento de transporte cumpla con las restricciones de transbordo especificadas en el crédito. Una violación puede resultar en rechazo.'
WHERE field_code = ':43T:' AND message_type = 'MT700';

-- SECTION: MERCANCIAS (Goods and Documents)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Descripción de Mercancías y/o Servicios (Description of Goods and/or Services)

Descripción:
Campo OBLIGATORIO que describe las mercancías o servicios cubiertos por el crédito documentario.

Formato:
Máximo 100 líneas de 65 caracteres cada una (6,500 caracteres totales)

Contenido típico:
1. Descripción general de las mercancías
2. Cantidad (unidades, peso, volumen)
3. Especificaciones técnicas
4. Calidad o grado
5. Precio unitario (opcional)
6. Marca/modelo (si aplica)
7. Incoterm aplicable

Ejemplo:
1000 METRIC TONS OF WHEAT
GRADE: NO. 2 YELLOW CORN
PACKING: IN BULK
ORIGIN: ARGENTINA
CROP YEAR: 2025
PRICE: USD 250.00 PER METRIC TON CFR VERACRUZ PORT

Principios importantes:

1. Debe ser suficientemente detallado para identificar las mercancías
2. NO debe ser tan específico que sea imposible cumplir
3. Evitar descripciones genéricas como "según factura"
4. Evitar términos vagos como "primera calidad"

Lenguaje permitido:
- Términos como "ABOUT", "APPROXIMATELY", "CIRCA" permiten tolerancia de ±10%
- NO usar "et cetera", "and so on", "etc."
- NO usar "as per contract" (debe especificarse en el crédito)

Discrepancias comunes:
- Factura describe mercancías diferentes
- Cantidad no coincide
- Especificaciones técnicas no mencionadas en factura

Nota crítica:
La descripción de mercancías en la factura comercial NO necesita ser palabra por palabra igual al crédito, pero NO puede contradecirla. Los demás documentos pueden usar descripción genérica (e.g., "goods as per invoice").'
WHERE field_code = ':45A:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Documentos Requeridos (Documents Required)

Descripción:
Campo OBLIGATORIO que especifica todos los documentos que el beneficiario debe presentar para obtener el pago.

Formato:
Máximo 100 líneas de 65 caracteres cada una

Documentos típicos:

1. DOCUMENTOS DE TRANSPORTE:
   - Bill of Lading (B/L) marítimo
   - Airway Bill (AWB) aéreo
   - CMR terrestre
   - Especificar: original/copia, número de juegos, consignatario

2. FACTURA COMERCIAL:
   - Número de originales y copias
   - Firma requerida (si aplica)
   - Certificaciones especiales

3. PACKING LIST:
   - Detalle de embalaje
   - Peso neto/bruto
   - Marcas de bultos

4. CERTIFICADOS:
   - Certificado de Origen
   - Certificado de Calidad
   - Certificado Fitosanitario
   - Certificado de Seguro
   - Certificado de Inspección

5. OTROS DOCUMENTOS:
   - Lista de empaque
   - Certificado de peso
   - Certificado de análisis

Ejemplo de redacción:

+ SIGNED COMMERCIAL INVOICE IN 3 ORIGINALS AND 2 COPIES

+ FULL SET OF CLEAN ON BOARD OCEAN BILLS OF LADING MADE OUT TO ORDER OF ISSUING BANK MARKED FREIGHT PREPAID AND NOTIFY APPLICANT

+ PACKING LIST IN 3 ORIGINALS AND 2 COPIES

+ CERTIFICATE OF ORIGIN ISSUED BY CHAMBER OF COMMERCE

+ INSURANCE POLICY OR CERTIFICATE IN NEGOTIABLE FORM FOR 110PCT OF INVOICE VALUE COVERING INSTITUTE CARGO CLAUSES A PLUS WAR AND STRIKES CLAUSES

Reglas importantes:

1. Especificar CANTIDAD de cada documento (originales/copias)
2. Especificar EMISOR del documento (si relevante)
3. Especificar CONTENIDO requerido
4. Usar lenguaje claro y no ambiguo
5. NO solicitar documentos imposibles de obtener
6. Los términos "fotocopias", "copias no negociables" deben especificarse claramente

Términos a evitar:
- "First class" / "Well known" - Muy subjetivos
- "Prompt" / "Immediately" - Sin fecha específica
- "Usual" / "Customary" - No están definidos

Nota según UCP 600:
Si un documento requerido no está definido en el crédito (ej: "certificado de inspección"), el banco aceptará cualquier documento que:
a) Parezca cumplir la función del documento requerido
b) Emitido y firmado por el beneficiario (salvo que se indique otro emisor)

Nota crítica:
Los bancos examinarán SOLO los documentos listados aquí. Si un documento no está en la lista, no será requerido aunque se mencione en otras partes del crédito.'
WHERE field_code = ':46A:' AND message_type = 'MT700';

-- SECTION: CONDICIONES (Additional Conditions and Instructions)

UPDATE swift_field_config_readmodel
SET documentation_url = 'Condiciones Adicionales (Additional Conditions)

Descripción:
Campo opcional para especificar términos y condiciones adicionales que no están cubiertos en otros campos del crédito.

Formato:
Máximo 100 líneas de 65 caracteres cada una

Uso apropiado:
- Instrucciones especiales de presentación
- Condiciones específicas del contrato comercial
- Requisitos regulatorios del país importador/exportador
- Certificaciones especiales
- Plazo de presentación de documentos

Ejemplos de condiciones adicionales:

PRESENTACIÓN DE DOCUMENTOS:
+ DOCUMENTS MUST BE PRESENTED WITHIN 21 DAYS AFTER SHIPMENT DATE BUT WITHIN THE VALIDITY OF THE CREDIT

+ ALL DOCUMENTS MUST BE IN ENGLISH LANGUAGE OR ACCOMPANIED BY ENGLISH TRANSLATION

CERTIFICACIONES:
+ BENEFICIARY MUST CERTIFY ON INVOICE THAT GOODS ARE OF [COUNTRY] ORIGIN

+ BENEFICIARY TO CERTIFY THAT ONE SET OF NON-NEGOTIABLE DOCUMENTS HAS BEEN SENT DIRECTLY TO APPLICANT WITHIN 7 DAYS OF SHIPMENT

INSTRUCCIONES ESPECIALES:
+ THIRD PARTY DOCUMENTS ACCEPTABLE

+ COPY OF EMAIL/COURIER RECEIPT EVIDENCING SENDING OF DOCUMENTS TO APPLICANT

+ INSURANCE TO BE COVERED BY BUYER (cuando es EXW/FOB)

Condiciones que NO deben incluirse:

1. NO contradecir términos en otros campos del crédito
2. NO incluir condiciones imposibles de verificar por el banco
3. NO incluir condiciones fuera del control del beneficiario
4. NO incluir condiciones que requieran juicio subjetivo del banco

Ejemplos de condiciones INACEPTABLES:
- "Goods must be of first quality" (subjetivo)
- "Shipment subject to opening of import license" (fuera de control)
- "Documents must reach us before [date]" (banco no controla tiempo de correo)
- "Subject to our final inspection" (permite al ordenante rechazar arbitrariamente)

Según UCP 600:
Los bancos NO verificarán condiciones relacionadas con:
- Calidad de las mercancías
- Cantidad embarcada (más allá de lo que muestran los documentos)
- Cumplimiento del contrato subyacente
- Condiciones de las mercancías

Consejo profesional:
Mantener las condiciones adicionales simples y documentales. Cada condición adicional aumenta el riesgo de discrepancias.

Nota crítica:
Si una condición no puede ser verificada mediante documentos, NO debe incluirse en el crédito. Los bancos solo examinan documentos, no realizan investigaciones.'
WHERE field_code = ':47A:' AND message_type = 'MT700';

UPDATE swift_field_config_readmodel
SET documentation_url = 'Plazo de Presentación de Documentos (Period for Presentation)

Descripción:
Campo opcional que especifica el número máximo de días después del embarque en que los documentos deben ser presentados al banco.

Formato:
Número de días (máximo 3 dígitos)

Ejemplo:
21 (significa "21 días después de la fecha de embarque")

Regla por defecto según UCP 600:
Si no se especifica, se aplica el estándar de UCP 600:
- Máximo 21 DÍAS CALENDARIO después de la fecha de embarque
- Pero NO después de la fecha de vencimiento del crédito
- Lo que ocurra primero

Cálculo del plazo:
- Día 1 = Día siguiente a la fecha de embarque
- Se cuentan días calendario (no días hábiles)
- Si el último día cae en día no hábil, se extiende al siguiente día hábil

Ejemplo de cálculo:
- Fecha de embarque: 1 de diciembre
- Plazo de presentación: 21 días
- Fecha límite: 22 de diciembre (o siguiente día hábil)
- Pero: Si el vencimiento del crédito es 15 de diciembre, prevalece el 15 de diciembre

Consideraciones prácticas:

PLAZOS COMUNES:
- 15 días: Para embarques cercanos o documentos courier
- 21 días: Estándar internacional
- 45 días: Para embarques con documentos por correo postal

FACTORES A CONSIDERAR:
- Tiempo de preparación de documentos
- Tiempo de correo/courier al banco
- Días festivos en ruta
- Disponibilidad de originales del transportista

Presentación tardía:
Si los documentos se presentan después del plazo pero antes del vencimiento:
- Es una DISCREPANCIA
- El banco puede rechazar los documentos
- El ordenante puede decidir aceptar con discrepancias

Nota importante:
La "fecha de presentación" es la fecha en que los documentos son recibidos por el banco nominado/confirmador, NO la fecha de envío por el beneficiario.

Consejo:
Para transacciones internacionales complejas, considere plazos más largos (30-45 días) para dar tiempo suficiente al beneficiario de obtener todos los documentos originales.'
WHERE field_code = ':48:' AND message_type = 'MT700';

-- SECTION: INSTRUCCIONES DE PAGO

UPDATE swift_field_config_readmodel
SET documentation_url = 'Comisiones (Charges)

Descripción:
Campo opcional que especifica quién paga las comisiones bancarias relacionadas con el crédito.

Opciones estándar:
- ALL CHARGES OUTSIDE [COUNTRY] ARE FOR ACCOUNT OF BENEFICIARY
- ALL CHARGES INCLUDING CONFIRMATION CHARGES ARE FOR ACCOUNT OF APPLICANT
- ALL BANKING CHARGES ARE FOR ACCOUNT OF APPLICANT EXCEPT CONFIRMATION CHARGES

Formato:
Texto libre, máximo 6 líneas de 65 caracteres

Tipos de comisiones bancarias:

1. COMISIONES DEL BANCO EMISOR:
   - Emisión del crédito
   - Enmiendas
   - Procesamiento de documentos

2. COMISIONES DEL BANCO NOTIFICADOR:
   - Notificación
   - Manejo de documentos

3. COMISIONES DEL BANCO CONFIRMADOR (si aplica):
   - Confirmación
   - Negociación de documentos

4. COMISIONES DE BANCOS INTERMEDIARIOS:
   - Transferencias SWIFT
   - Corresponsalía

5. COMISIONES DE REEMBOLSO:
   - Reembolso interbancario

Distribución típica según Incoterms:

FOB/FCA:
- Comprador paga comisiones de emisión
- Vendedor paga comisiones fuera del país del banco emisor

CIF/CFR/CIP:
- Similar a FOB, pero vendedor incluye costos en precio

EXW:
- Normalmente todas las comisiones son del comprador

Cláusula recomendada:
"ALL BANKING CHARGES OUTSIDE [COUNTRY OF ISSUING BANK] ARE FOR ACCOUNT OF BENEFICIARY"

Esto significa:
- Ordenante paga: Emisión, enmiendas, aceptación/pago
- Beneficiario paga: Notificación, negociación, confirmación (si la solicita)

Nota importante:
Las comisiones pueden ser significativas (0.1% - 0.5% del monto del crédito). Deben acordarse claramente entre comprador y vendedor antes de emitir el crédito.

Según UCP 600:
Si el crédito no especifica quién paga las comisiones, el beneficiario es responsable de todas las comisiones del banco nominado/confirmador, y el ordenante de las comisiones del banco emisor.'
WHERE field_code = ':71B:' AND message_type = 'MT700';

-- SECTION: TRANSFERENCIA Y ENMIENDAS

UPDATE swift_field_config_readmodel
SET documentation_url = 'Crédito Transferible (Transferable Credit)

Descripción:
Campo opcional que indica si el beneficiario puede transferir el crédito (total o parcialmente) a uno o más segundos beneficiarios.

Opciones:
- TRANSFERABLE: El crédito puede ser transferido
- NOT TRANSFERABLE: El crédito NO puede ser transferido
- (vacío): Si no se especifica, el crédito es NO TRANSFERIBLE

Formato:
Palabra clave fija (máximo 16 caracteres)

¿Qué es un crédito transferible?

Un crédito transferible permite al beneficiario original (primer beneficiario) transferir total o parcialmente sus derechos bajo el crédito a uno o más terceros (segundos beneficiarios).

Uso común:
- Intermediarios comerciales (trading companies)
- Beneficiario original no es el productor/exportador real
- Operaciones triangulares de comercio

Requisitos según UCP 600:

1. El crédito DEBE indicar explícitamente "TRANSFERABLE"
2. Solo puede transferirse una vez
3. La transferencia solo puede hacerse en los términos del crédito original, excepto:
   - Monto puede ser menor
   - Precio unitario puede ser menor
   - Fecha de vencimiento puede ser anterior
   - Plazo de presentación puede ser menor
   - Período de embarque puede ser anterior

Ejemplo de estructura:

CRÉDITO ORIGINAL:
Beneficiario: ABC Trading Company
Monto: USD 100,000
Mercancía: 1000 toneladas de trigo

TRANSFERENCIA:
Segundo Beneficiario: XYZ Farms (productor real)
Monto: USD 90,000 (diferencia = margen del intermediario)
Mercancía: 1000 toneladas de trigo
Mismos términos de embarque y documentos

Proceso de transferencia:

1. Primer beneficiario solicita transferencia al banco transferidor
2. Banco transferidor notifica al segundo beneficiario
3. Segundo beneficiario embarca y presenta documentos
4. Primer beneficiario puede sustituir sus propias facturas
5. Banco paga a segundo beneficiario (monto menor)
6. Diferencia va al primer beneficiario

Comisiones:
El primer beneficiario paga las comisiones de transferencia.

Limitaciones importantes:

- NO puede transferirse parcialmente a múltiples segundos beneficiarios si el crédito prohíbe embarques parciales
- El segundo beneficiario NO puede transferir nuevamente (solo una transferencia)
- Todos los términos del crédito original siguen vigentes

Nota crítica:
Un crédito es transferible SOLO si explícitamente dice "TRANSFERABLE". No hay transferibilidad implícita bajo UCP 600.'
WHERE field_code = ':40B:' AND message_type = 'MT700';

-- CAMPOS DE CONFIRMACIÓN

UPDATE swift_field_config_readmodel
SET documentation_url = 'Confirmación Requerida (Confirmation Instructions)

Descripción:
Campo opcional que indica si se requiere que un banco agregue su confirmación al crédito.

Opciones:
- MAY ADD: El banco notificador PUEDE agregar confirmación si el beneficiario lo solicita
- MUST ADD: El banco notificador DEBE agregar confirmación (sin su confirmación, el crédito no es válido)
- WITHOUT: Sin confirmación (solo compromiso del banco emisor)

Formato:
Código fijo según las opciones

¿Qué es la confirmación?

La confirmación es el compromiso definitivo de un banco (banco confirmador) de honrar o negociar los documentos conformes, INDEPENDIENTEMENTE de si el banco emisor paga o no.

Ventajas de un crédito confirmado:

Para el BENEFICIARIO (exportador):
1. Seguridad adicional: Dos bancos garantizan el pago
2. Protección contra riesgo país (del país del importador)
3. Protección contra insolvencia del banco emisor
4. Pago más rápido (el banco confirmador paga localmente)

Para el ORDENANTE (importador):
1. Facilita negociaciones con proveedores en países con percepción de alto riesgo
2. Puede ser requisito del vendedor para aceptar el crédito

Proceso de confirmación:

1. Banco emisor solicita confirmación al banco notificador
2. Banco notificador evalúa el riesgo:
   - Riesgo del banco emisor
   - Riesgo país
   - Términos del crédito
3. Si acepta, agrega su confirmación
4. Notifica al beneficiario que el crédito está confirmado

Costos:
La confirmación tiene un costo adicional (típicamente 0.1% - 1% del monto del crédito por trimestre), que normalmente paga:
- El ordenante (si se especifica en campo :71B:)
- El beneficiario (si él la solicita y el crédito dice "MAY ADD")

Diferencia entre opciones:

MUST ADD (Confirmación obligatoria):
- El crédito NO es operativo hasta que esté confirmado
- El banco notificador DEBE confirmar
- Si el banco notificador se niega, debe informar inmediatamente

MAY ADD (Confirmación opcional):
- El crédito es operativo sin confirmación
- El beneficiario puede solicitar confirmación
- El banco notificador puede negarse sin penalización

WITHOUT (Sin confirmación):
- Solo el banco emisor tiene obligación de pago
- El banco notificador actúa solo como intermediario

Cuándo solicitar confirmación:

1. Cuando el banco emisor está en un país con:
   - Inestabilidad política
   - Controles de cambio
   - Riesgo de no transferencia de divisas

2. Cuando hay dudas sobre:
   - Solvencia del banco emisor
   - Capacidad del banco emisor de cumplir

3. Cuando el beneficiario:
   - Requiere certeza absoluta de pago
   - Necesita financiamiento pre-embarque de su banco local

Nota importante:
Un crédito confirmado proporciona el más alto nivel de seguridad en comercio internacional, pero tiene un costo adicional que debe justificarse por el nivel de riesgo.'
WHERE field_code = ':49:' AND message_type = 'MT700';

-- Mensajes informativos
SELECT 'MT700 documentation_url population completed successfully' as status;
SELECT COUNT(*) as total_updated FROM swift_field_config_readmodel WHERE message_type = 'MT700' AND documentation_url IS NOT NULL;
