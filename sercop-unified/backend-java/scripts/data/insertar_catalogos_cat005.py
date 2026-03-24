#!/usr/bin/env python3
import requests
import json
import time

API_BASE_URL = "http://localhost:8080/api"
CATALOGO_PADRE_ID = 1761255327531

registros = [
    ("1110", "PRODUCCION AGROPECUARIA"),
    ("1201", "ACTIVIDADES PROFESIONALES, CIENTIFICAS Y TECNICAS"),
    ("1220", "EXPLOTACION DE MADERA"),
    ("1301", "PESCA DE ALTURA Y COSTERA"),
    ("1302", "COMERCIO AL POR MENOR, EXCEPTO EL DE VEHICULOS AUTOMOTORES Y"),
    ("1303", "COMERCIO Y REPARACION DE VEHICULOS AUTOMOTORES Y MOTOCICLETA"),
    ("1304", "COMERCIO AL POR MAYOR, EXCEPTO EL DE VEHICULOS AUTOMOTORES Y"),
    ("1401", "DISTRIBUCION DE AGUA; ALCANTARILLADO, GESTION DE DESECHOS Y"),
    ("1601", "ACTIVIDADES INMOBILIARIAS"),
    ("2200", "PRODUCCION DE PETROLEO, CRUDO Y GAS NATURAL"),
    ("2300", "EXTRACCION DE MINERALES METALICOS"),
    ("2400", "EXPLOTACION DE MINAS Y CANTERAS"),
    ("2900", "EXTRACCION DE OTROS MINERALES"),
    ("3100", "PRODUCTOS ALIMENTICIOS"),
    ("3112", "FABRICACION DE EQUIPO ELECTRICO"),
    ("3113", "FABRICACION DE MAQUINARIA Y EQUIPO NCP"),
    ("3116", "FABRICACION DE PRENDAS DE VESTIR"),
    ("3117", "FABRICACION DE PRODUCTOS DE INFORMATICA, ELECTRONICA Y OPTIC"),
    ("3118", "FABRICACION DE PRODUCTOS ELABORADOS DE METAL, EXCEPTO MAQUIN"),
    ("3119", "FABRICACION DE PRODUCTOS FARMACEUTICOS, SUSTANCIAS QUIMICAS"),
    ("3124", "OTRAS INDUSTRIAS MANUFACTURERAS"),
    ("3125", "REPARACION E INSTALACION DE MAQUINARIA Y EQUIPO"),
    ("3200", "TEXTILES, PRENDAS DE VESTIR E INDUSTRIAS DEL CUERO"),
    ("3300", "INDUSTRIA Y PRODUCTOS DE LA MADERA"),
    ("3400", "FABRICACION DE PAPEL Y PRODUCTOS DE PAPEL"),
    ("3500", "FABRICACION DE PRODUCTOS QUIMICOS, DERIVADOS DE CAUCHO Y PLA"),
    ("3600", "FABRICACION DE PRODUCTOS MINERALES NO METALICOS"),
    ("3700", "INDUSTRIAS METALICAS BASICAS"),
    ("3800", "FABRICACION DE PRODUCTOS METALICOS, MAQUINARIA Y EQUIPO"),
    ("4100", "ELECTRICIDAD, GAS Y VAPOR"),
    ("5000", "CONSTRUCCION"),
    ("6100", "COMERCIO"),
    ("6300", "RESTAURANTES Y HOTELES"),
    ("7100", "TRANSPORTE Y ALMACENAMIENTO"),
    ("7200", "COMUNICACIONES"),
    ("8100", "ESTABLECIMIENTOS FINANCIEROS"),
    ("8200", "SEGUROS"),
    ("8300", "SERVICIOS PRESTADOS A EMPRESAS"),
    ("9100", "ADMINISTRACION PUBLICA Y DEFENSA"),
    ("9200", "SERVICIOS DE SANEAMIENTO Y SIMILARES"),
    ("9310", "INSTRUCCION PUBLICA"),
    ("9331", "SERVICIOS MEDICOS QUIRURGICOS Y OTROS SERVICIOS DE SANIDAD"),
    ("9332", "SERVICIOS DE VETERINARIA"),
    ("9340", "INSTITUCIONES DE ASISTENCIA SOCIAL"),
    ("9350", "ASOCIACIONES COMERCIALES, PROFESIONALES Y LABORALES"),
    ("9400", "SERVICIOS DE DIVERSION, ESPARCIMIENTO Y CULTURALES"),
    ("9500", "SERVICIOS PERSONALES Y DE LOS HOGARES"),
    ("9900", "ACTIVIDADES NO ECONOMICAS"),
]

print(f"Insertando {len(registros)} registros en CAT-005...")
exitosos = 0
errores = 0

for idx, (codigo, nombre) in enumerate(registros, 1):
    data = {
        "codigo": codigo,
        "nombre": nombre,
        "descripcion": nombre,
        "nivel": 2,
        "catalogoPadreId": CATALOGO_PADRE_ID,
        "activo": True,
        "orden": idx
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/catalogos-personalizados/commands",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code in [200, 201]:
            exitosos += 1
            print(f"✓ [{idx}/{len(registros)}] {codigo} - {nombre}")
        else:
            errores += 1
            print(f"✗ [{idx}/{len(registros)}] {codigo} - Error: {response.status_code} - {response.text}")

    except Exception as e:
        errores += 1
        print(f"✗ [{idx}/{len(registros)}] {codigo} - Exception: {str(e)}")

    # Pequeña pausa para no saturar el servidor
    time.sleep(0.1)

print(f"\n{'='*60}")
print(f"Resumen:")
print(f"Total registros: {len(registros)}")
print(f"Exitosos: {exitosos}")
print(f"Errores: {errores}")
print(f"{'='*60}")
