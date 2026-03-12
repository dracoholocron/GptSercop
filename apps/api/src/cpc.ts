/**
 * CPC (Clasificador Central de Productos) – sugerencias para actividad del proveedor.
 * En desarrollo: stub con lista estática. En producción este módulo deberá delegar
 * en un servicio externo (SRI o correlacionador SERCOP) para validar actividades del
 * proveedor; la interfaz (parámetros q, limit y formato de respuesta) se mantendrá
 * para no romper el frontend.
 */
export interface CpcSuggestion {
  code: string;
  description: string;
}

const CPC_LIST: CpcSuggestion[] = [
  { code: '43110', description: 'Obras de construcción de edificios residenciales' },
  { code: '43120', description: 'Obras de construcción de edificios no residenciales' },
  { code: '43210', description: 'Obras de construcción de carreteras y autopistas' },
  { code: '43220', description: 'Obras de construcción de puentes y túneles' },
  { code: '43230', description: 'Obras de construcción de vías férreas' },
  { code: '44110', description: 'Obras de construcción de redes eléctricas' },
  { code: '44120', description: 'Obras de construcción de redes de telecomunicaciones' },
  { code: '44210', description: 'Obras de construcción de oleoductos y gasoductos' },
  { code: '44220', description: 'Obras de construcción de redes de agua y saneamiento' },
  { code: '45110', description: 'Preparación del terreno' },
  { code: '45120', description: 'Perforaciones y sondeos' },
  { code: '45200', description: 'Servicios de construcción e instalación' },
  { code: '45300', description: 'Servicios de acabado de edificios' },
  { code: '46110', description: 'Servicios de agrimensura' },
  { code: '46120', description: 'Servicios de ingeniería y diseños técnicos' },
  { code: '46210', description: 'Servicios de consultoría en ingeniería' },
  { code: '46220', description: 'Servicios de gestión de proyectos' },
  { code: '46310', description: 'Servicios de ensayos y análisis técnicos' },
  { code: '46320', description: 'Servicios de inspección y control de calidad' },
  { code: '46410', description: 'Servicios de limpieza de edificios' },
  { code: '46420', description: 'Servicios de paisajismo y mantenimiento de zonas verdes' },
  { code: '46510', description: 'Servicios de seguridad y vigilancia' },
  { code: '46520', description: 'Servicios de recepción y atención al público' },
  { code: '46610', description: 'Servicios de reprografía y copiado' },
  { code: '46620', description: 'Servicios de traducción e interpretación' },
  { code: '47110', description: 'Comercio al por menor de productos alimenticios' },
  { code: '47190', description: 'Comercio al por menor en establecimientos no especializados' },
  { code: '47210', description: 'Comercio al por menor de equipos de oficina y cómputo' },
  { code: '47220', description: 'Comercio al por menor de muebles y artículos para el hogar' },
  { code: '47300', description: 'Comercio al por menor de combustibles' },
  { code: '47410', description: 'Comercio al por menor de equipos de telecomunicaciones' },
  { code: '47420', description: 'Comercio al por menor de equipos de audio y video' },
  { code: '47510', description: 'Comercio al por menor de textiles y confección' },
  { code: '47520', description: 'Comercio al por menor de ferretería y materiales' },
  { code: '47610', description: 'Comercio al por menor de libros y papelería' },
  { code: '47620', description: 'Comercio al por menor de artículos deportivos' },
  { code: '47710', description: 'Comercio al por menor de productos farmacéuticos' },
  { code: '47720', description: 'Comercio al por menor de artículos médicos y ortopédicos' },
  { code: '49110', description: 'Transporte de pasajeros por ferrocarril' },
  { code: '49120', description: 'Transporte de carga por ferrocarril' },
  { code: '49210', description: 'Transporte de pasajeros por carretera' },
  { code: '49220', description: 'Transporte de carga por carretera' },
  { code: '49310', description: 'Transporte por tuberías' },
  { code: '49320', description: 'Transporte de carga por vía acuática' },
  { code: '50100', description: 'Transporte de pasajeros por vía marítima' },
  { code: '50200', description: 'Transporte de carga por vía marítima' },
  { code: '50300', description: 'Transporte fluvial' },
  { code: '50400', description: 'Transporte aéreo de pasajeros y carga' },
  { code: '51100', description: 'Servicios de almacenamiento y depósito' },
  { code: '51200', description: 'Servicios de manipulación de carga' },
  { code: '52110', description: 'Servicios de mantenimiento y reparación de equipos de oficina' },
  { code: '52120', description: 'Servicios de mantenimiento y reparación de maquinaria' },
  { code: '52210', description: 'Servicios de instalación de equipos informáticos' },
  { code: '52220', description: 'Servicios de instalación de equipos de telecomunicaciones' },
  { code: '53100', description: 'Servicios de correos' },
  { code: '53210', description: 'Servicios de mensajería y paquetería' },
  { code: '53220', description: 'Servicios de entrega a domicilio' },
  { code: '55110', description: 'Servicios de hoteles y alojamiento' },
  { code: '55120', description: 'Servicios de camping y albergues' },
  { code: '55210', description: 'Servicios de restaurantes y comedores' },
  { code: '55220', description: 'Servicios de catering' },
  { code: '60100', description: 'Producción y distribución de programas de radio' },
  { code: '60210', description: 'Producción y distribución de programas de televisión' },
  { code: '60220', description: 'Servicios de transmisión por cable' },
  { code: '61100', description: 'Servicios de telefonía fija' },
  { code: '61200', description: 'Servicios de telefonía móvil' },
  { code: '61300', description: 'Servicios de transmisión de datos e internet' },
  { code: '62100', description: 'Servicios de procesamiento de datos' },
  { code: '62200', description: 'Servicios de hospedaje y alojamiento web' },
  { code: '71110', description: 'Servicios de arrendamiento de maquinaria y equipo' },
  { code: '71120', description: 'Servicios de arrendamiento de equipos de oficina' },
  { code: '71210', description: 'Servicios de arrendamiento de vehículos automotores' },
  { code: '71220', description: 'Servicios de arrendamiento de equipo de transporte' },
  { code: '72100', description: 'Servicios de arquitectura e ingeniería' },
  { code: '72210', description: 'Servicios de consultoría en sistemas informáticos' },
  { code: '72220', description: 'Servicios de desarrollo de software' },
  { code: '73100', description: 'Servicios de investigación y desarrollo experimental' },
  { code: '74110', description: 'Servicios jurídicos' },
  { code: '74120', description: 'Servicios de contabilidad y auditoría' },
  { code: '74210', description: 'Servicios de consultoría en gestión' },
  { code: '74220', description: 'Servicios de consultoría en recursos humanos' },
  { code: '74300', description: 'Servicios de publicidad' },
  { code: '75110', description: 'Servicios de administración pública general' },
  { code: '75120', description: 'Servicios de regulación y supervisión' },
  { code: '81100', description: 'Servicios integrados de instalación y mantenimiento' },
  { code: '82110', description: 'Servicios de reprografía' },
  { code: '82120', description: 'Servicios de encuadernación' },
  { code: '82200', description: 'Servicios de traducción' },
  { code: '83110', description: 'Servicios de cobranza e información crediticia' },
  { code: '83120', description: 'Servicios de asesoría financiera' },
  { code: '84110', description: 'Servicios de seguros generales' },
  { code: '84120', description: 'Servicios de seguros de vida' },
  { code: '85110', description: 'Servicios de administración pública en salud' },
  { code: '85120', description: 'Servicios de hospitales y clínicas' },
  { code: '85200', description: 'Servicios de medicina general y especializada' },
  { code: '85310', description: 'Servicios odontológicos' },
  { code: '85320', description: 'Servicios de laboratorio clínico' },
  { code: '86100', description: 'Servicios de hospitales y atención de salud' },
  { code: '86210', description: 'Servicios de prácticas médicas generales' },
  { code: '86220', description: 'Servicios de prácticas médicas especializadas' },
  { code: '87100', description: 'Servicios de residencias para adultos mayores' },
  { code: '87200', description: 'Servicios de atención a personas con discapacidad' },
  { code: '91110', description: 'Servicios de organizaciones empresariales' },
  { code: '91120', description: 'Servicios de organizaciones profesionales' },
  { code: '92110', description: 'Servicios de producción de películas y videos' },
  { code: '92120', description: 'Servicios de distribución de películas y videos' },
  { code: '92200', description: 'Servicios de radio y televisión' },
  { code: '93110', description: 'Gestión de instalaciones deportivas' },
  { code: '93120', description: 'Servicios de actividades deportivas' },
  { code: '93210', description: 'Servicios de parques de atracciones' },
  { code: '93220', description: 'Servicios de salas de juego' },
];

/**
 * Obtiene sugerencias de códigos CPC (stub). En producción reemplazar por llamada
 * a servicio SRI/correlacionador manteniendo la misma firma y formato de respuesta.
 */
export function getCpcSuggestions(q: string, limit: number): CpcSuggestion[] {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const lower = q.trim().toLowerCase();
  if (!lower) {
    return CPC_LIST.slice(0, safeLimit);
  }
  const filtered = CPC_LIST.filter(
    (item) =>
      item.code.includes(lower) ||
      item.description.toLowerCase().includes(lower)
  );
  return filtered.slice(0, safeLimit);
}
