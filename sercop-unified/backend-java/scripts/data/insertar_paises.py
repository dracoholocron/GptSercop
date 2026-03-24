#!/usr/bin/env python3
import requests
import json
import time

API_BASE_URL = "http://localhost:8080/api"

# Países del mundo con código ISO 3166-1 alpha-2
countries = [
    ("AF", "Afghanistan"),
    ("AL", "Albania"),
    ("DZ", "Algeria"),
    ("AD", "Andorra"),
    ("AO", "Angola"),
    ("AG", "Antigua and Barbuda"),
    ("AR", "Argentina"),
    ("AM", "Armenia"),
    ("AU", "Australia"),
    ("AT", "Austria"),
    ("AZ", "Azerbaijan"),
    ("BS", "Bahamas"),
    ("BH", "Bahrain"),
    ("BD", "Bangladesh"),
    ("BB", "Barbados"),
    ("BY", "Belarus"),
    ("BE", "Belgium"),
    ("BZ", "Belize"),
    ("BJ", "Benin"),
    ("BT", "Bhutan"),
    ("BO", "Bolivia"),
    ("BA", "Bosnia and Herzegovina"),
    ("BW", "Botswana"),
    ("BR", "Brazil"),
    ("BN", "Brunei"),
    ("BG", "Bulgaria"),
    ("BF", "Burkina Faso"),
    ("BI", "Burundi"),
    ("CV", "Cabo Verde"),
    ("KH", "Cambodia"),
    ("CM", "Cameroon"),
    ("CA", "Canada"),
    ("CF", "Central African Republic"),
    ("TD", "Chad"),
    ("CL", "Chile"),
    ("CN", "China"),
    ("CO", "Colombia"),
    ("KM", "Comoros"),
    ("CG", "Congo"),
    ("CD", "Congo (Democratic Republic)"),
    ("CR", "Costa Rica"),
    ("HR", "Croatia"),
    ("CU", "Cuba"),
    ("CY", "Cyprus"),
    ("CZ", "Czech Republic"),
    ("CI", "Côte d'Ivoire"),
    ("DK", "Denmark"),
    ("DJ", "Djibouti"),
    ("DM", "Dominica"),
    ("DO", "Dominican Republic"),
    ("EC", "Ecuador"),
    ("EG", "Egypt"),
    ("SV", "El Salvador"),
    ("GQ", "Equatorial Guinea"),
    ("ER", "Eritrea"),
    ("EE", "Estonia"),
    ("SZ", "Eswatini"),
    ("ET", "Ethiopia"),
    ("FJ", "Fiji"),
    ("FI", "Finland"),
    ("FR", "France"),
    ("GA", "Gabon"),
    ("GM", "Gambia"),
    ("GE", "Georgia"),
    ("DE", "Germany"),
    ("GH", "Ghana"),
    ("GR", "Greece"),
    ("GD", "Grenada"),
    ("GT", "Guatemala"),
    ("GN", "Guinea"),
    ("GW", "Guinea-Bissau"),
    ("GY", "Guyana"),
    ("HT", "Haiti"),
    ("HN", "Honduras"),
    ("HU", "Hungary"),
    ("IS", "Iceland"),
    ("IN", "India"),
    ("ID", "Indonesia"),
    ("IR", "Iran"),
    ("IQ", "Iraq"),
    ("IE", "Ireland"),
    ("IL", "Israel"),
    ("IT", "Italy"),
    ("JM", "Jamaica"),
    ("JP", "Japan"),
    ("JO", "Jordan"),
    ("KZ", "Kazakhstan"),
    ("KE", "Kenya"),
    ("KI", "Kiribati"),
    ("KP", "Korea (North)"),
    ("KR", "Korea (South)"),
    ("KW", "Kuwait"),
    ("KG", "Kyrgyzstan"),
    ("LA", "Laos"),
    ("LV", "Latvia"),
    ("LB", "Lebanon"),
    ("LS", "Lesotho"),
    ("LR", "Liberia"),
    ("LY", "Libya"),
    ("LI", "Liechtenstein"),
    ("LT", "Lithuania"),
    ("LU", "Luxembourg"),
    ("MG", "Madagascar"),
    ("MW", "Malawi"),
    ("MY", "Malaysia"),
    ("MV", "Maldives"),
    ("ML", "Mali"),
    ("MT", "Malta"),
    ("MH", "Marshall Islands"),
    ("MR", "Mauritania"),
    ("MU", "Mauritius"),
    ("MX", "Mexico"),
    ("FM", "Micronesia"),
    ("MD", "Moldova"),
    ("MC", "Monaco"),
    ("MN", "Mongolia"),
    ("ME", "Montenegro"),
    ("MA", "Morocco"),
    ("MZ", "Mozambique"),
    ("MM", "Myanmar"),
    ("NA", "Namibia"),
    ("NR", "Nauru"),
    ("NP", "Nepal"),
    ("NL", "Netherlands"),
    ("NZ", "New Zealand"),
    ("NI", "Nicaragua"),
    ("NE", "Niger"),
    ("NG", "Nigeria"),
    ("MK", "North Macedonia"),
    ("NO", "Norway"),
    ("OM", "Oman"),
    ("PK", "Pakistan"),
    ("PW", "Palau"),
    ("PS", "Palestine"),
    ("PA", "Panama"),
    ("PG", "Papua New Guinea"),
    ("PY", "Paraguay"),
    ("PE", "Peru"),
    ("PH", "Philippines"),
    ("PL", "Poland"),
    ("PT", "Portugal"),
    ("QA", "Qatar"),
    ("RO", "Romania"),
    ("RU", "Russia"),
    ("RW", "Rwanda"),
    ("KN", "Saint Kitts and Nevis"),
    ("LC", "Saint Lucia"),
    ("VC", "Saint Vincent and the Grenadines"),
    ("WS", "Samoa"),
    ("SM", "San Marino"),
    ("ST", "Sao Tome and Principe"),
    ("SA", "Saudi Arabia"),
    ("SN", "Senegal"),
    ("RS", "Serbia"),
    ("SC", "Seychelles"),
    ("SL", "Sierra Leone"),
    ("SG", "Singapore"),
    ("SK", "Slovakia"),
    ("SI", "Slovenia"),
    ("SB", "Solomon Islands"),
    ("SO", "Somalia"),
    ("ZA", "South Africa"),
    ("SS", "South Sudan"),
    ("ES", "Spain"),
    ("LK", "Sri Lanka"),
    ("SD", "Sudan"),
    ("SR", "Suriname"),
    ("SE", "Sweden"),
    ("CH", "Switzerland"),
    ("SY", "Syria"),
    ("TJ", "Tajikistan"),
    ("TZ", "Tanzania"),
    ("TH", "Thailand"),
    ("TL", "Timor-Leste"),
    ("TG", "Togo"),
    ("TO", "Tonga"),
    ("TT", "Trinidad and Tobago"),
    ("TN", "Tunisia"),
    ("TR", "Turkey"),
    ("TM", "Turkmenistan"),
    ("TV", "Tuvalu"),
    ("UG", "Uganda"),
    ("UA", "Ukraine"),
    ("AE", "United Arab Emirates"),
    ("GB", "United Kingdom"),
    ("US", "United States"),
    ("UY", "Uruguay"),
    ("UZ", "Uzbekistan"),
    ("VU", "Vanuatu"),
    ("VA", "Vatican City"),
    ("VE", "Venezuela"),
    ("VN", "Vietnam"),
    ("YE", "Yemen"),
    ("ZM", "Zambia"),
    ("ZW", "Zimbabwe"),
]

print("Paso 1: Verificando catálogo padre 'COUNTRY'...")

# Primero intentar obtener el catálogo padre existente
CATALOGO_PADRE_ID = None
try:
    response = requests.get(
        f"{API_BASE_URL}/custom-catalogs/queries/codigo/COUNTRY",
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        response_data = response.json()
        if response_data.get("success"):
            CATALOGO_PADRE_ID = response_data.get("data", {}).get("id")
            print(f"✓ Catálogo padre 'COUNTRY' ya existe con ID: {CATALOGO_PADRE_ID}")
        else:
            print(f"  Catálogo padre no existe, creando...")
    else:
        print(f"  Catálogo padre no existe, creando...")

except Exception as e:
    print(f"  Error al buscar catálogo padre, creando...")

# Si no existe, crearlo
if CATALOGO_PADRE_ID is None:
    catalogo_padre_data = {
        "codigo": "COUNTRY",
        "nombre": "Countries",
        "descripcion": "Countries of the world",
        "nivel": 1,
        "catalogoPadreId": None,
        "activo": True,
        "orden": 1
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/custom-catalogs/commands",
            json=catalogo_padre_data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code in [200, 201]:
            response_data = response.json()
            if response_data.get("success"):
                CATALOGO_PADRE_ID = response_data.get("data", {}).get("id")
                print(f"✓ Catálogo padre 'COUNTRY' creado con ID: {CATALOGO_PADRE_ID}")
            else:
                print(f"✗ Error al crear catálogo padre: {response_data.get('message')}")
                exit(1)
        else:
            print(f"✗ Error al crear catálogo padre: {response.status_code} - {response.text}")
            exit(1)

    except Exception as e:
        print(f"✗ Exception al crear catálogo padre: {str(e)}")
        exit(1)

# Pequeña pausa
time.sleep(0.5)

print(f"\nPaso 2: Insertando {len(countries)} países...")
exitosos = 0
errores = 0

for idx, (codigo, nombre) in enumerate(countries, 1):
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
            f"{API_BASE_URL}/custom-catalogs/commands",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code in [200, 201]:
            exitosos += 1
            print(f"✓ [{idx}/{len(countries)}] {codigo} - {nombre}")
        else:
            errores += 1
            print(f"✗ [{idx}/{len(countries)}] {codigo} - Error: {response.status_code} - {response.text}")

    except Exception as e:
        errores += 1
        print(f"✗ [{idx}/{len(countries)}] {codigo} - Exception: {str(e)}")

    # Pequeña pausa para no saturar el servidor
    time.sleep(0.1)

print(f"\n{'='*60}")
print(f"Resumen:")
print(f"Total países: {len(countries)}")
print(f"Exitosos: {exitosos}")
print(f"Errores: {errores}")
print(f"{'='*60}")
