# Mapa detallado del portal SERCOP/Compras Públicas (reverse engineering)

Generado: 2026-03-12T18:36:43.903Z

## Resumen ejecutivo
- Páginas rastreadas: **80**
- Páginas con formularios: **26**
- Formularios detectados: **31**
- Campos detectados: **178**
- Cobertura de labels explícitos: **3.3%**
- Casos con subflujos/campos ocultos/riesgo: **26**

## Arquitectura observada
- Frontend legacy (Prototype/Scriptaculous + JS imperativo).
- Uso fuerte de iframes para subflujos (ej. productos CPC).
- Form submit híbrido: `action` tradicional + acciones JS/AJAX.
- Campos hidden serializados (`txtArreglo*`, `*Enviar`) para listas dinámicas.

## Mapa por módulo / páginas / formularios / campos

### Módulo: AVC (páginas: 1, formularios: 0, campos: 0)

### Módulo: BEN (páginas: 1, formularios: 0, campos: 0)

### Módulo: CM (páginas: 1, formularios: 1, campos: 3)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CM/FrmCMPValidacionRuc.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/ExeCMPValidacionRuc.php`
  - campo: `ruc` id:`ruc` tag:input type:text label:`-` reglas:`maxlength:13; format:ruc(13)`
  - campo: `accion` id:`accion` tag:input type:hidden label:`type="text" id="ruc" name="ruc" maxlength="13" onkeypress="return solo_numeros(event);">` reglas:`format:ruc(13)`
  - campo: `-` id:`-` tag:button type:button label:`name="accion" type="hidden" id="accion" value="Guardar"/>` reglas:`maxlength:-`

### Módulo: CPA (páginas: 1, formularios: 1, campos: 8)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CPA/FrmCPABusqueda.cpe
- Form 1: id=`cpaBuscadorFilter` name=`-` method=`post` action=`../exe/ExeCpaRegistroConvenio.php`
  - campo: `idProceso` id:`idProceso` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `nombreEntidad` id:`nombreEntidad` tag:input type:text label:`type="hidden" name="idProceso" id="idProceso" value="" /> Entidad Contratante:` reglas:`maxlength:-`
  - campo: `personaId` id:`personaId` tag:input type:hidden label:`class="form-control form-control-sm" readonly id="nombreEntidad" name="nombreEntidad" value="" />` reglas:`maxlength:-`
  - campo: `cmbEstadoConvenio` id:`cmbEstadoConvenio` tag:select type:- label:`re de la Entidad Contratante, de la cual desea buscar Procesos. Estado del Convenio de Pago u Otro Instrumento Jurídico:` reglas:`maxlength:-`
  - campo: `codigo` id:`codigo` tag:input type:text label:`venios de pago u otros instrumentos jurídicos que desea buscar. Código del Convenio de Pago u Otro Instrumento Jurídico:` reglas:`maxlength:30; required`
  - campo: `fechaInicioCP` id:`fechaInicioCP` tag:input type:text label:`grese el código del convenio de pago u otro instrumento jurídico a buscar, ej: SERCOP-CP-001. Por fechas de Suscripción:` reglas:`maxlength:100; required; format:date-part`
  - campo: `fechaFinCP` id:`fechaFinCP` tag:input type:text label:`ass="form-control required form-control-sm" readonly maxlength="100" id="fechaInicioCP" name="fechaInicioCP" value="" />` reglas:`maxlength:100; required; format:date-part`
  - campo: `textoCaptcha` id:`textoCaptcha` tag:input type:text label:`/> Seleccione el período de la fecha de suscripción del convenio de pago u otro instrumento jurídico. Actualizar Captcha` reglas:`format:date-part`

### Módulo: CPC (páginas: 1, formularios: 1, campos: 1)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CPC/index.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../EX/paso7_cpc_exe.cpe`
  - campo: `txtArregloCategoriaProductos` id:`txtArregloCategoriaProductos` tag:input type:hidden label:`-` reglas:`maxlength:-`

### Módulo: css (páginas: 15, formularios: 0, campos: 0)

### Módulo: EMG (páginas: 1, formularios: 0, campos: 0)

### Módulo: EP (páginas: 3, formularios: 5, campos: 22)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/EmpReporteIncumplidos.cpe?sg=1
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/IncumplidosGeneral_exe.php`
  - campo: `personaId` id:`personaId` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `txtNumeroInvitados` id:`txtNumeroInvitados` tag:input type:hidden label:`type='hidden' name='personaId' id='personaId' value="" > Proveedores Incumplidos y Adjudicatarios Fallidos` reglas:`maxlength:-`
  - campo: `idSoliCompra` id:`idSoliCompra` tag:input type:hidden label:`type="hidden" name="txtNumeroInvitados" id="txtNumeroInvitados" value="" />` reglas:`maxlength:-`
  - campo: `paginaActual` id:`paginaActual` tag:input type:hidden label:`type="hidden" name="idSoliCompra" id="idSoliCompra" value="">` reglas:`maxlength:-`
  - campo: `tipoProceso` id:`tipoProceso` tag:input type:hidden label:`type="hidden" name="paginaActual" id="paginaActual" value="0" />` reglas:`maxlength:-`
  - campo: `ACCION` id:`-` tag:input type:hidden label:`type="hidden" name="tipoProceso" id="tipoProceso" value="" />` reglas:`maxlength:-`
- Form 2: id=`formRadio` name=`formRadio` method=`post` action=`-`
  - campo: `porRuc` id:`porRuc` tag:input type:radio label:`Buscar Proveedor:` reglas:`format:ruc(13)`
  - campo: `porRuc` id:`porRuc` tag:input type:radio label:`Buscar Proveedor:` reglas:`format:ruc(13)`
  - campo: `ruc` id:`ruc` tag:input type:text label:`me="porRuc" id="porRuc" onclick="cajatextoCambiar(this.value);" type="radio" value="porRazon" /> Por Raz&oacute;n Social` reglas:`maxlength:20; format:ruc(13)`
  - campo: `txtRazonSocial` id:`txtRazonSocial` tag:input type:text label:`name="ruc" type="text" id="ruc" size="40" maxlength="20" value=''/>` reglas:`format:ruc(13)`
  - campo: `btnBuscar` id:`btnBuscar` tag:input type:button label:`name="txtRazonSocial" type="text" id="txtRazonSocial" size="40" style="display:none"/>` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/RepCertificados.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`-`
- Form 2: id=`formRadio` name=`formRadio` method=`post` action=`-`
  - campo: `porRuc` id:`porRuc` tag:input type:radio label:`Seleccione el criterio de b&uacute;squeda:` reglas:`format:ruc(13)`
  - campo: `porRuc` id:`porRuc` tag:input type:radio label:`Seleccione el criterio de b&uacute;squeda:` reglas:`format:ruc(13)`
  - campo: `ruc` id:`ruc` tag:input type:text label:`name="porRuc" id="porRuc" onclick="cajatextoCambiar(this.value);" type="radio" value="porRUC" /> Por RUC / C&eacute;dula` reglas:`maxlength:20; format:ruc(13)`
  - campo: `codigo` id:`codigo` tag:input type:text label:`name="ruc" type="text" id="ruc" size="40" maxlength="20" style="display:none" value='' />` reglas:`format:ruc(13)`
  - campo: `btnBuscar` id:`btnBuscar` tag:input type:button label:`name="codigo" type="text" id="codigo" size="40" />` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/ReseteoContraseniaProveedor.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`#`
  - campo: `ruc` id:`txtruc` tag:input type:text label:`RUC del Proveedor o Entidad Contratante que desea solicitar el Reseteo de la Contraseña. RUC / NUMERO DE IDENTIFICACION:` reglas:`format:ruc(13); format:password`
  - campo: `mail` id:`mail` tag:input type:text label:`grese el correo electrónico. Importante: debe ingresar el correo electrónico principal de su cuenta. CORREO ELECTRÓNICO:` reglas:`format:email?`
  - campo: `anio` id:`anio` tag:select type:- label:`al / Persona Natural. Importante: esa fecha fue ingresada la primera vez que usted hizo su registro FECHA DE NACIMIENTO:` reglas:`format:date-part`
  - campo: `mes` id:`mes` tag:select type:- label:` 1924 1923 1922 1921 1920 1919 1918 1917 1916 1915 1914 1913 1912 1911 1910 1909 1908 1907 1906 1905 1904 1903 1902 1901` reglas:`format:date-part`
  - campo: `dia` id:`dia` tag:select type:- label:`id="mes" name="mes"> Mes.. 01 02 03 04 05 06 07 08 09 10 11 12` reglas:`format:date-part`
  - campo: `image` id:`image` tag:input type:text label:` 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 &thinsp; CHEQUEO DE SEGURIDAD &thinsp; Reload Captcha` reglas:`maxlength:-`

### Módulo: exe (páginas: 2, formularios: 0, campos: 0)

### Módulo: FO (páginas: 6, formularios: 4, campos: 26)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/formularioCertificados.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/EnviarCertificado_exe.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `cmbTipoCertificado` id:`cmbTipoCertificado` tag:select type:- label:`type="hidden" name="csrf_token" value="MTc3MzM0MDExNTE1cUNkdzlRT0NCbVdjRVhkdFBVblMxd2VGUFo0TXhU"> Tipo de Certificado` reglas:`maxlength:-`
  - campo: `cmbTipoPersona` id:`cmbTipoPersona` tag:select type:- label:`ta incumplido o adjudicatario fallido con el Estado Seleccione el tipo de certificado que desea obtener. Tipo de Persona` reglas:`maxlength:-`
  - campo: `ruc` id:`ruc` tag:input type:text label:`rechos y contraer responsabilidades. Seleccione el tipo de persona que desea obtener el certificado. &nbsp; RUC / Cédula` reglas:`maxlength:13; format:ruc(13)`
  - campo: `rucRepre` id:`rucRepre` tag:input type:text label:`e el RUC de la empresa o el Número de Cédula de la persona que solicita el certificado. Cédula/RUC - Representante Legal` reglas:`maxlength:13; format:ruc(13)`
  - campo: `-` id:`-` tag:button type:button label:`"; validarRUCCedula(this,true,'');' /> Ingrese correctamente el RUC o Número de Cédula del representante legal. Regresar` reglas:`format:ruc(13)`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/informacionPaso1.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/paso1.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/paso1_exe.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `optAcepto` id:`-` tag:input type:radio label:`3MzM0MDExNVNLSkp1djQ3Tk5LSm9WRXA4NHJyd3ZvdVk3eXltOHlO"> &nbsp; Aceptaci&oacute;n de T&eacute;rminos y Condiciones &nbsp;` reglas:`maxlength:-`
  - campo: `optAcepto` id:`-` tag:input type:radio label:`3MzM0MDExNVNLSkp1djQ3Tk5LSm9WRXA4NHJyd3ZvdVk3eXltOHlO"> &nbsp; Aceptaci&oacute;n de T&eacute;rminos y Condiciones &nbsp;` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/paso8.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/paso8_exe.php`
  - campo: `csrf_token_p2` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `cumplePA` id:`cumplePASI` tag:input type:radio label:`dos con Fuentes Oficiales. &nbsp; ¿Cumple Usted con la normativa para ser proveedor de proyectos financiados con el BID?` reglas:`maxlength:-`
  - campo: `cumplePA` id:`cumplePANO` tag:input type:radio label:`id='cumplePASI' name='cumplePA' type='radio' value='SI' /> Si` reglas:`maxlength:-`
  - campo: `txtObligado` id:`txtObligado` tag:input type:text label:`y todos los subcontratistas deben cumplir con los requisitos arriba establecidos. &nbsp; Obligado a llevar Contabilidad:` reglas:`maxlength:3`
  - campo: `cmbFacturacionAnual` id:`cmbFacturacionAnual` tag:select type:- label:`s,true,"vacio");' /> Informaci&oacute;n tomada del Servicio de Rentas Internas &nbsp; * Ventas / Ingresos Brutos Anuales` reglas:`maxlength:-`
  - campo: `forNombreCategoria` id:`forNombreCategoria` tag:input type:hidden label:`kground="#FFFFFF"; ' > $0 - $300 000 $300 001 - $1 000 000 $1 000 001 - $5 000 000 más de 5 000 000 Tama&ntilde;o: Micro` reglas:`maxlength:-`
  - campo: `anioFiscalSri` id:`anioFiscalSri` tag:input type:hidden label:`type = 'hidden' id='forNombreCategoria' name='forNombreCategoria' value="Es7g0RahV1YfCcrB5GeDEOuB3AV1llMvUyoWu__9M7A,">` reglas:`format:date-part`
  - campo: `txtPorExporta` id:`txtPorExporta` tag:input type:text label:`oqSeTF2R5G16BffxjT57fitu6hWf1sHO8hJs,"> Categor&iacute;a establecida acorde al rango seleccionado &nbsp; * % que Exporta` reglas:`maxlength:3`
  - campo: `cmbNumeroTrabajadores` id:`cmbNumeroTrabajadores` tag:select type:- label:`a el caracter % De su facturaci&oacute;n anual que porcentaje exporta &nbsp; * N&uacute;mero de Trabajadores Permanentes` reglas:`maxlength:-`
  - campo: `txtActivosTotales` id:`txtActivosTotales` tag:input type:text label:` directa, dependiente de la misma y a tiempo completo, seg&uacute;n las modalidades del sector. &nbsp; * Activos totales` reglas:`maxlength:10`
  - campo: `txtPasivosTotales` id:`txtPasivosTotales` tag:input type:text label:`odos sus activos Ejemplo: Casas, muebles, veh&iacute;culos, dinero en efectivo, en bancos, etc. &nbsp; * Pasivos totales` reglas:`maxlength:10`
  - campo: `txtPatrimonio` id:`txtPatrimonio` tag:input type:text label:`584.12 Ingrese el valor total de todos sus pasivos Ejemplo: Deudas con bancos, con proveedores, etc. &nbsp; * Patrimonio` reglas:`maxlength:10`
  - campo: `HddPatrimonio` id:`HddPatrimonio` tag:input type:hidden label:`ound="#FFFFFF"; this.select(); ' onblur='this.style.background="#FFFFFF"; validarMensajeDiv (this,true,"decimales");' />` reglas:`maxlength:10`
  - campo: `txtPorMateriaPrima` id:`txtPorMateriaPrima` tag:input type:text label:`); ' onblur='this.style.background="#FFFFFF"; ' /> Valor resultante de Activos - Pasivos &nbsp; * % de Agregado Nacional` reglas:`maxlength:3`
  - campo: `txtAnioFiscal` id:`txtAnioFiscal` tag:input type:text label:`ra que ha sido transformada o procesada en Ecuador previo a ser la materia prima del proveedor. &nbsp; A&ntilde;o fiscal` reglas:`maxlength:10; format:date-part`
  - campo: `txtArregloPrestamos` id:`txtArregloPrestamos` tag:input type:hidden label:`us='this.style.background="#FFFFFF"; this.select(); ' onblur='this.style.background="#FFFFFF"; ' /> Valor tomado del SRI` reglas:`maxlength:-`

### Módulo: IC (páginas: 1, formularios: 1, campos: 15)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/IC/buscarInfima.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`&nbsp; Entidad Contratante:` reglas:`maxlength:-`
  - campo: `cmbEntidad` id:`cmbEntidad` tag:input type:hidden label:`cols="50" rows="2" name="txtEntidadContratante" id="txtEntidadContratante" readonly="readonly">` reglas:`maxlength:-`
  - campo: `txtNroFactInfima` id:`txtNroFactInfima` tag:input type:text label:`scar E”, para encontrar el nombre de la Entidad Contratante, de la cual desea buscar Procesos. N&uacute;mero de Factura:` reglas:`maxlength:20`
  - campo: `txtIdProducto` id:`txtIdProducto` tag:input type:text label:`F"; this.select(); ' onblur='this.style.background="#FFFFFF"; ' /> Ingrese el número de factura que fue registrada. CPC:` reglas:`maxlength:-`
  - campo: `txtObsInfima` id:`txtObsInfima` tag:input type:text label:`lue=""/> Ingrese el código del producto, bien o servicio que tiene relación a las facturas ingresadas. Objeto de Compra:` reglas:`maxlength:20`
  - campo: `txtCodTipoCompraTab` id:`txtCodTipoCompraTab` tag:input type:hidden label:` ' onblur='this.style.background="#FFFFFF"; ' /> Ingrese el objeto de la adquisición que desea consultar. Tipo de Compra` reglas:`maxlength:50`
  - campo: `txtCodTipoCompra` id:`txtCodTipoCompra` tag:select type:- label:`' value = '176' onfocus='this.style.background="#FFFFFF"; this.select(); ' onblur='this.style.background="#FFFFFF"; ' />` reglas:`maxlength:-`
  - campo: `txtMes` id:`txtMes` tag:select type:- label:`sición que usted registró de acuerdo a la casuística que determina la ínfima cuantía. Facturas Registradas en el mes de:` reglas:`format:date-part`
  - campo: `txtAnio` id:`txtAnio` tag:select type:- label:` opci&oacute;n el sistema listara las facturas registradas en un determinado mes. Facturas Registradas en el a&ntilde;o:` reglas:`format:date-part`
  - campo: `f_inicio` id:`f_inicio` tag:input type:text label:`n el sistema listara las facturas registradas en un determinado a&ntilde;o. Fechas de Emisión de Facturas: Desde: &nbsp;` reglas:`maxlength:10; format:date-part`
  - campo: `f_fin` id:`f_fin` tag:input type:text label:`%m-%d", button : "ico_f_inicio", align : "Tl", singleClick : true }); &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hasta: &nbsp;` reglas:`maxlength:10`
  - campo: `count` id:`count` tag:input type:hidden label:`r listará el detalle de todos los items ingresados en las difrerentes facturas registradas por cada Entidad Contratante.` reglas:`maxlength:-`
  - campo: `paginaActual` id:`paginaActual` tag:input type:hidden label:`type='hidden' id='count' name='count' />` reglas:`maxlength:-`
  - campo: `estado` id:`estado` tag:input type:hidden label:`type='hidden' id='paginaActual' name='paginaActual' />` reglas:`maxlength:-`
  - campo: `trx` id:`trx` tag:input type:hidden label:`type='hidden' id='estado' name='estado' />` reglas:`maxlength:-`

### Módulo: img (páginas: 6, formularios: 0, campos: 0)

### Módulo: js (páginas: 23, formularios: 0, campos: 0)

### Módulo: LOGIN (páginas: 2, formularios: 2, campos: 10)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/
- Form 1: id=`frmIngreso` name=`frmIngreso` method=`post` action=`javascript:void(0)`
  - campo: `txtRUCRecordatorio` id:`txtRUCRecordatorio` tag:input type:text label:`Bienvenidos Ingrese los datos para el acceso al sistema &nbsp; RUC: N&uacute;mero Identificaci&oacute;n` reglas:`maxlength:100; format:ruc(13)`
  - campo: `txtLogin` id:`txtLogin` tag:input type:text label:`"box" size="17" maxlength="100" value="" id="txtRUCRecordatorio" name="txtRUCRecordatorio" /> Usuario: Nombre de Usuario` reglas:`maxlength:100; format:ruc(13)`
  - campo: `txtPassword` id:`txtPassword` tag:input type:password label:`size="17" maxlength="100" value="" id="txtLogin" name="txtLogin"/> Contrase&ntilde;a: Su contraseña de compras públicas.` reglas:`maxlength:100; format:password`
  - campo: `btnEntrar` id:`btnEntrar` tag:button type:button label:`sword" name="txtPassword" autocomplete="off"/> Recordarme en este computador &nbsp; ¿Olvid&oacute; su contrase&ntilde;a?` reglas:`format:password`
  - campo: `txtVerifica` id:`txtVerifica` tag:input type:hidden label:`id="btnEntrar" type="button" name="btnEntrar" onclick="_lCominc()" >Entrar` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/index.php
- Form 1: id=`frmIngreso` name=`frmIngreso` method=`post` action=`javascript:void(0)`
  - campo: `txtRUCRecordatorio` id:`txtRUCRecordatorio` tag:input type:text label:`Bienvenidos Ingrese los datos para el acceso al sistema &nbsp; RUC: N&uacute;mero Identificaci&oacute;n` reglas:`maxlength:100; format:ruc(13)`
  - campo: `txtLogin` id:`txtLogin` tag:input type:text label:`"box" size="17" maxlength="100" value="" id="txtRUCRecordatorio" name="txtRUCRecordatorio" /> Usuario: Nombre de Usuario` reglas:`maxlength:100; format:ruc(13)`
  - campo: `txtPassword` id:`txtPassword` tag:input type:password label:`size="17" maxlength="100" value="" id="txtLogin" name="txtLogin"/> Contrase&ntilde;a: Su contraseña de compras públicas.` reglas:`maxlength:100; format:password`
  - campo: `btnEntrar` id:`btnEntrar` tag:button type:button label:`sword" name="txtPassword" autocomplete="off"/> Recordarme en este computador &nbsp; ¿Olvid&oacute; su contrase&ntilde;a?` reglas:`format:password`
  - campo: `txtVerifica` id:`txtVerifica` tag:input type:hidden label:`id="btnEntrar" type="button" name="btnEntrar" onclick="_lCominc()" >Entrar` reglas:`maxlength:-`

### Módulo: NCO (páginas: 1, formularios: 0, campos: 0)

### Módulo: PC (páginas: 4, formularios: 4, campos: 56)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarPACe.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/consultarPACe_exe.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`xNWZwV0lTY2Q3ekRzZkNnTjlmYWdKTm5xeHd1cmF0ZDZy"> Buscar &nbsp; Limpiar &nbsp; Imprimir &nbsp; &nbsp; Entidad Contratante:` reglas:`maxlength:-`
  - campo: `cmbEntidad` id:`cmbEntidad` tag:input type:hidden label:`cols="50" rows="2" name="txtEntidadContratante" id="txtEntidadContratante" readonly="readonly">` reglas:`maxlength:-`
  - campo: `cmbAnio` id:`cmbAnio` tag:input type:hidden label:`type="hidden" id="cmbEntidad" name="cmbEntidad" value="hvrm_MXV9hMYupNK0So9dcGfo7AiQGWTgbToRuHjJI4," />` reglas:`format:date-part`
  - campo: `cmbNombre` id:`cmbNombre` tag:input type:hidden label:`type="hidden" id="cmbAnio" name="cmbAnio" value="" />` reglas:`format:date-part`
  - campo: `txtAnio` id:`txtAnio` tag:select type:- label:`bot&oacute;n “Buscar E”, para encontrar el nombre de la Entidad Contratante, de la cual desea buscar el PAC. &nbsp; Año:` reglas:`format:date-part`
  - campo: `txtAdquisicionId` id:`txtAdquisicionId` tag:input type:hidden label:`po de Producto Cat. Electrónico Procedimiento Descripci&oacute;n Cant. U. Medida Costo U. V. Total &nbsp; Per&iacute;odo` reglas:`maxlength:-`
  - campo: `txtAdquisicionId` id:`txtAdquisicionId` tag:input type:hidden label:`po de Producto Cat. Electrónico Procedimiento Descripci&oacute;n Cant. U. Medida Costo U. V. Total &nbsp; Per&iacute;odo` reglas:`maxlength:-`
  - campo: `trx` id:`trx` tag:input type:hidden label:`type="hidden" name="txtAdquisicionId" id="txtAdquisicionId" />` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProceso.cpe?sg=1
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/consultarProcesos_exe.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `idus` id:`idus` tag:input type:hidden label:`type="hidden" name="csrf_token" value="MTc3MzM0MDExNWo2VVB2bjJIdHE2U3J2VXdCZEZTd0xaSEZXajY2bDVX">` reglas:`maxlength:-`
  - campo: `UsuarioID` id:`UsuarioID` tag:input type:hidden label:`type="hidden" id="idus" name="idus" value="">` reglas:`maxlength:-`
  - campo: `captccc2` id:`captccc2` tag:input type:hidden label:`type="hidden" id="UsuarioID" name="UsuarioID" value="">` reglas:`maxlength:-`
  - campo: `txtPalabrasClaves` id:`txtPalabrasClaves` tag:input type:text label:`esionar el bot&oacute;n 'Buscar Entidad', e ingresar el nombre de la Entidad que desea consultar. &nbsp; Palabras claves` reglas:`maxlength:30`
  - campo: `Entidadbuscar` id:`Entidadbuscar` tag:input type:hidden label:`contrar procesos seg&uacute;n palabras claves ingresadas; ej: &quot;computador&quot;, &quot;camar&oacute;n&quot;. &nbsp;` reglas:`maxlength:-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`type="hidden" name="Entidadbuscar" id="Entidadbuscar" value=""/> Entidad Contratante` reglas:`maxlength:-`
  - campo: `cmbEntidad` id:`cmbEntidad` tag:input type:hidden label:`cols="50" rows="2" name="txtEntidadContratante" id="txtEntidadContratante" >` reglas:`maxlength:-`
  - campo: `txtCodigoTipoCompra` id:`txtCodigoTipoCompra` tag:select type:- label:`para encontrar el nombre de la Entidad Contratante, de la cual desea buscar Procesos. &nbsp; Tipo de Contrataci&oacute;n` reglas:`maxlength:-`
  - campo: `txtCodigoProceso` id:`txtCodigoProceso` tag:input type:text label:` del Proceso &nbsp; Seleccione el Estado en que se encuentren los procesos interesados. &nbsp; C&oacute;digo del Proceso` reglas:`maxlength:60`
  - campo: `f_inicio` id:`f_inicio` tag:input type:text label:`ngrese el c&oacute;digo del proceso a buscar, ej: INCOP-SI-001 &nbsp; Por Fechas de Publicaci&oacute;n (*) Desde: &nbsp;` reglas:`maxlength:10; format:date-part`
  - campo: `f_fin` id:`f_fin` tag:input type:text label:`%Y-%m-%d", button: "ico_f_inicio", align: "Tl", singleClick: true }); &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hasta: &nbsp;` reglas:`maxlength:10`
  - campo: `image` id:`image` tag:input type:text label:` Captcha &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;` reglas:`maxlength:-`
  - campo: `count` id:`count` tag:input type:hidden label:` &nbsp; &nbsp; &nbsp; Buscar &nbsp; Limpiar &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;` reglas:`maxlength:-`
  - campo: `paginaActual` id:`paginaActual` tag:input type:hidden label:`type='hidden' id='count' name='count' />` reglas:`maxlength:-`
  - campo: `estado` id:`estado` tag:input type:hidden label:`type='hidden' id='paginaActual' name='paginaActual' />` reglas:`maxlength:-`
  - campo: `trx` id:`trx` tag:input type:hidden label:`type='hidden' id='estado' name='estado' />` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProcesoRE.cpe?op=P
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/consultarProcesos_exe.php`
  - campo: `captccc2` id:`captccc2` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `idus` id:`idus` tag:input type:hidden label:`type="hidden" name="captccc2" id="captccc2" value="0"/>` reglas:`maxlength:-`
  - campo: `UsuarioID` id:`UsuarioID` tag:input type:hidden label:`type="hidden" id="idus" name="idus" value="">` reglas:`maxlength:-`
  - campo: `txtPalabrasClaves` id:`txtPalabrasClaves` tag:input type:text label:`idden" id="UsuarioID" name="UsuarioID" value=""> Para Buscar Procesos: Presione el botón Buscar. &nbsp; Palabras claves:` reglas:`maxlength:30`
  - campo: `Entidadbuscar` id:`Entidadbuscar` tag:input type:hidden label:`contrar procesos seg&uacute;n palabras claves ingresadas; ej: &quot;computador&quot;, &quot;camar&oacute;n&quot;. &nbsp;` reglas:`maxlength:-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`type="hidden" name="Entidadbuscar" id="Entidadbuscar" value=""/> Entidad Contratante:` reglas:`maxlength:-`
  - campo: `cmbEntidad` id:`cmbEntidad` tag:input type:hidden label:`cols="50" rows="2" name="txtEntidadContratante" id="txtEntidadContratante" readonly="readonly">` reglas:`maxlength:-`
  - campo: `txtTiposContratacion` id:`txtTiposContratacion` tag:input type:hidden label:`ara encontrar el nombre de la Entidad Contratante, de la cual desea buscar Procesos. &nbsp; Tipo de Contrataci&oacute;n:` reglas:`maxlength:50`
  - campo: `txtCodigoProceso` id:`txtCodigoProceso` tag:input type:text label:`el Proceso: &nbsp; Seleccione el Estado en que se encuentren los procesos interesados. &nbsp; C&oacute;digo del Proceso:` reglas:`maxlength:60`
  - campo: `f_inicio` id:`f_inicio` tag:input type:text label:`/> Ingrese el c&oacute;digo del proceso a buscar, ej: INCOP-SI-001 &nbsp; Por Fechas de Publicaci&oacute;n Desde: &nbsp;` reglas:`maxlength:10; format:date-part`
  - campo: `f_fin` id:`f_fin` tag:input type:text label:`%m-%d", button : "ico_f_inicio", align : "Tl", singleClick : true }); &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hasta: &nbsp;` reglas:`maxlength:10`
  - campo: `count` id:`count` tag:input type:hidden label:`el campo "Palabras claves" lo que necesita buscar y clic en el enlace. &nbsp; &nbsp; Buscar &nbsp; Limpiar &nbsp; &nbsp;` reglas:`maxlength:-`
  - campo: `paginaActual` id:`paginaActual` tag:input type:hidden label:`type='hidden' id='count' name='count' />` reglas:`maxlength:-`
  - campo: `estado` id:`estado` tag:input type:hidden label:`type='hidden' id='paginaActual' name='paginaActual' />` reglas:`maxlength:-`
  - campo: `trx` id:`trx` tag:input type:hidden label:`type='hidden' id='estado' name='estado' />` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProcesoRE.cpe?op=R
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/consultarProcesos_exe.php`
  - campo: `captccc2` id:`captccc2` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `idus` id:`idus` tag:input type:hidden label:`type="hidden" name="captccc2" id="captccc2" value="0"/>` reglas:`maxlength:-`
  - campo: `UsuarioID` id:`UsuarioID` tag:input type:hidden label:`type="hidden" id="idus" name="idus" value="">` reglas:`maxlength:-`
  - campo: `txtPalabrasClaves` id:`txtPalabrasClaves` tag:input type:text label:`idden" id="UsuarioID" name="UsuarioID" value=""> Para Buscar Procesos: Presione el botón Buscar. &nbsp; Palabras claves:` reglas:`maxlength:30`
  - campo: `Entidadbuscar` id:`Entidadbuscar` tag:input type:hidden label:`contrar procesos seg&uacute;n palabras claves ingresadas; ej: &quot;computador&quot;, &quot;camar&oacute;n&quot;. &nbsp;` reglas:`maxlength:-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`type="hidden" name="Entidadbuscar" id="Entidadbuscar" value=""/> Entidad Contratante:` reglas:`maxlength:-`
  - campo: `cmbEntidad` id:`cmbEntidad` tag:input type:hidden label:`cols="50" rows="2" name="txtEntidadContratante" id="txtEntidadContratante" readonly="readonly">` reglas:`maxlength:-`
  - campo: `txtTiposContratacion` id:`txtTiposContratacion` tag:input type:hidden label:`ara encontrar el nombre de la Entidad Contratante, de la cual desea buscar Procesos. &nbsp; Tipo de Contrataci&oacute;n:` reglas:`maxlength:50`
  - campo: `txtCodigoProceso` id:`txtCodigoProceso` tag:input type:text label:`el Proceso: &nbsp; Seleccione el Estado en que se encuentren los procesos interesados. &nbsp; C&oacute;digo del Proceso:` reglas:`maxlength:60`
  - campo: `f_inicio` id:`f_inicio` tag:input type:text label:`/> Ingrese el c&oacute;digo del proceso a buscar, ej: INCOP-SI-001 &nbsp; Por Fechas de Publicaci&oacute;n Desde: &nbsp;` reglas:`maxlength:10; format:date-part`
  - campo: `f_fin` id:`f_fin` tag:input type:text label:`%m-%d", button : "ico_f_inicio", align : "Tl", singleClick : true }); &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Hasta: &nbsp;` reglas:`maxlength:10`
  - campo: `count` id:`count` tag:input type:hidden label:`el campo "Palabras claves" lo que necesita buscar y clic en el enlace. &nbsp; &nbsp; Buscar &nbsp; Limpiar &nbsp; &nbsp;` reglas:`maxlength:-`
  - campo: `paginaActual` id:`paginaActual` tag:input type:hidden label:`type='hidden' id='count' name='count' />` reglas:`maxlength:-`
  - campo: `estado` id:`estado` tag:input type:hidden label:`type='hidden' id='paginaActual' name='paginaActual' />` reglas:`maxlength:-`
  - campo: `trx` id:`trx` tag:input type:hidden label:`type='hidden' id='estado' name='estado' />` reglas:`maxlength:-`

### Módulo: ROOT (páginas: 2, formularios: 0, campos: 0)

### Módulo: RP (páginas: 1, formularios: 1, campos: 2)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RP/ProveedorAdjudicadomontos.cpe
- Form 1: id=`frmDatos` name=`frmDatos` method=`post` action=`-`
  - campo: `ruc` id:`ruc` tag:input type:text label:`s disposiciones del art&iacute;culo 59 de la RGLOSNCP &nbsp; Ingrese el n&uacute;mero de RUC del proveedor: &nbsp;&nbsp;` reglas:`maxlength:15; format:ruc(13)`
  - campo: `Buscar` id:`Buscar` tag:button type:button label:`name="ruc" type="text" id="ruc" size="40" maxlength="15" value="" />` reglas:`format:ruc(13)`

### Módulo: RPE (páginas: 2, formularios: 4, campos: 8)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe
- Form 1: id=`-` name=`frmCabecera` method=`get` action=`-`
  - campo: `cmbIdioma` id:`cmbIdioma` tag:select type:- label:`-` reglas:`maxlength:-`
- Form 2: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/ExeRpPaso1.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `optAcepto` id:`optAceptoSI` tag:input type:radio label:`n" value="MTc3MzM0MDExNTcxMjVJYUExaFNpbWxibjFWVVJCRHFtYUJaaGlqendv"> &nbsp; Aceptación de Términos y Condiciones: &nbsp;` reglas:`maxlength:-`
  - campo: `optAcepto` id:`optAceptoNO` tag:input type:radio label:`adio' value='SI' onclick='actualizarValor(this.value);' /> Sí , declaro que he leído y Acepto los Términos y Condiciones` reglas:`maxlength:-`

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe?cmbIdioma=es
- Form 1: id=`-` name=`frmCabecera` method=`get` action=`-`
  - campo: `cmbIdioma` id:`cmbIdioma` tag:select type:- label:`-` reglas:`maxlength:-`
- Form 2: id=`frmDatos` name=`frmDatos` method=`post` action=`../exe/ExeRpPaso1.php`
  - campo: `csrf_token` id:`-` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `optAcepto` id:`optAceptoSI` tag:input type:radio label:`n" value="MTc3MzM0MDExNVlCQVg1ZDJTdFNseVhtcXI1VjBGTmFJVEd0VnlTWkNx"> &nbsp; Aceptación de Términos y Condiciones: &nbsp;` reglas:`maxlength:-`
  - campo: `optAcepto` id:`optAceptoNO` tag:input type:radio label:`adio' value='SI' onclick='actualizarValor(this.value);' /> Sí , declaro que he leído y Acepto los Términos y Condiciones` reglas:`maxlength:-`

### Módulo: SL (páginas: 1, formularios: 2, campos: 2)

#### https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/SL/view/Emergencia/buscarResolucion.cpe
- Form 1: id=`formPrincipal` name=`formPrincipal` method=`-` action=`-`
  - campo: `persona_idHidden` id:`persona_idHidden` tag:input type:hidden label:`-` reglas:`maxlength:-`
  - campo: `txtEntidadContratante` id:`txtEntidadContratante` tag:textarea type:- label:`type="hidden" name="persona_idHidden" id="persona_idHidden" value=""/>` reglas:`maxlength:-`
- Form 2: id=`frmDatos` name=`frmDatos` method=`-` action=`-`

## Flujos críticos identificados
1. **Login**: RUC + usuario + password, validación JS/AJAX y luego submit a ejecutor.
2. **Registro proveedor FO (pasos 1-8)**: wizard secuencial con datos generales, identidad, dirección, contactos, productos CPC e indicadores.
3. **Consultas públicas**: PAC, Ínfimas, Certificados, Convenios y otros formularios de búsqueda.
4. **Productos CPC**: flujo embebido por iframe + búsqueda/navegador + serialización de selección.

## Gaps y riesgos técnicos
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/ :: form frmIngreso :: action-js/empty, hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CM/FrmCMPValidacionRuc.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CPA/FrmCPABusqueda.cpe :: form cpaBuscadorFilter :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/CPC/index.cpe :: form frmDatos :: iframe-subflow, hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/EmpReporteIncumplidos.cpe?sg=1 :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/EmpReporteIncumplidos.cpe?sg=1 :: form formRadio :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/RepCertificados.cpe :: form frmDatos :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/RepCertificados.cpe :: form formRadio :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/EP/ReseteoContraseniaProveedor.cpe :: form frmDatos :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/formularioCertificados.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/informacionPaso1.cpe :: form frmDatos :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/paso1.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/FO/paso8.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/IC/buscarInfima.cpe :: form frmDatos :: action-js/empty, hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/index.php :: form frmIngreso :: action-js/empty, hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarPACe.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProceso.cpe?sg=1 :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProcesoRE.cpe?op=P :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/PC/buscarProcesoRE.cpe?op=R :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RP/ProveedorAdjudicadomontos.cpe :: form frmDatos :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe :: form form_0 :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe?cmbIdioma=es :: form form_0 :: action-js/empty
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/RPE/rppaso1.cpe?cmbIdioma=es :: form frmDatos :: hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/SL/view/Emergencia/buscarResolucion.cpe :: form formPrincipal :: action-js/empty, hidden-serialized-fields
- https://www.compraspublicas.gob.ec/ProcesoContratacion/compras/SL/view/Emergencia/buscarResolucion.cpe :: form frmDatos :: action-js/empty
