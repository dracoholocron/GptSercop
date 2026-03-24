/**
 * CPPAAWizardChat - Asistente inteligente para crear Plan Anual de Adquisiciones
 * Guia al usuario paso a paso, ENRIQUECE y PROFESIONALIZA cada respuesta con IA
 * segun la LOSNCP, RGLOSNCP y resoluciones SERCOP.
 *
 * La IA actua como consultor experto: toma descripciones basicas del usuario,
 * las expande en items concretos con codigos CPC, cantidades, costos y procesos,
 * sugiere items adicionales tipicos del sector, y permite refinamiento iterativo.
 *
 * v2: Supports dynamic methodology from BD, split layout with dashboard panel,
 * workspace/department mode for collaborative PAA creation, and methodology selection.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Icon,
  Badge,
  Button,
  Input,
  Spinner,
  IconButton,
  Textarea,
  NativeSelect,
} from '@chakra-ui/react';
import {
  FiSend,
  FiUser,
  FiCheck,
  FiRotateCcw,
  FiPlus,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { LuBrain, LuSparkles } from 'react-icons/lu';
import { useTheme } from '../../../contexts/ThemeContext';
import { getLegalHelp, type CPLegalHelpResponse } from '../../../services/cpAIService';
import CPAIResponseDisplay from './CPAIResponseDisplay';
import CPPAAMethodologyDashboard, { type PhaseResult } from './CPPAAMethodologyDashboard';
import {
  type CPPAAMethodology,
  getActiveMethodologies,
} from '../../../services/cpMethodologyService';
import { updatePhaseData } from '../../../services/cpWorkspaceService';

// ============================================================================
// TYPES
// ============================================================================

interface WizardMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: QuickOption[];
  aiResponse?: CPLegalHelpResponse;
  severity?: 'info' | 'warning' | 'error';
}

interface QuickOption {
  label: string;
  value: string;
  color?: string;
}

interface PAAWizardData {
  entityName: string;
  entityRuc: string;
  sector: string;
  sectorLabel: string;
  missionSummary: string;
  totalBudget: number;
  departments: string[];
  needs: string;
  enrichedNeeds: string;
  needsValidated: boolean;
  priorities: string;
  timeline: string;
}

type WizardStep =
  | 'WELCOME'
  | 'ENTITY_NAME'
  | 'ENTITY_VALIDATING'
  | 'ENTITY_RUC'
  | 'SECTOR'
  | 'BUDGET'
  | 'DEPARTMENTS_SUGGESTING'
  | 'DEPARTMENTS'
  | 'NEEDS'
  | 'NEEDS_ENRICHING'
  | 'NEEDS_CLARIFYING'
  | 'NEEDS_ENRICHED'
  | 'NEEDS_REFINING'
  | 'PRIORITIES'
  | 'GENERATING'
  | 'PROPOSAL';

interface CPPAAWizardChatProps {
  fiscalYear: number;
  workspaceId?: string;
  departmentPlanId?: string;
  departmentName?: string;
  entityName?: string;
  entityRuc?: string;
  defaultExpanded?: boolean;
  onCreatePAA?: (data: { entityName: string; entityRuc: string }) => void;
  onSubmitDepartmentPlan?: (proposalResponse: any) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SECTOR_OPTIONS: QuickOption[] = [
  { label: 'Salud Publica', value: 'SALUD', color: 'red' },
  { label: 'Educacion', value: 'EDUCACION', color: 'blue' },
  { label: 'Infraestructura y Obras', value: 'INFRAESTRUCTURA', color: 'orange' },
  { label: 'Tecnologia e Innovacion', value: 'TECNOLOGIA', color: 'cyan' },
  { label: 'Gobierno y Administracion', value: 'GOBIERNO', color: 'purple' },
  { label: 'Seguridad Ciudadana', value: 'SEGURIDAD', color: 'green' },
  { label: 'Transporte y Movilidad', value: 'TRANSPORTE', color: 'yellow' },
  { label: 'Otro sector', value: 'OTRO', color: 'gray' },
];

const PRIORITY_OPTIONS: QuickOption[] = [
  { label: 'Operatividad critica', value: 'Priorizar items de operatividad critica y cumplimiento legal obligatorio', color: 'red' },
  { label: 'Proyectos de inversion', value: 'Priorizar proyectos de inversion y desarrollo institucional', color: 'blue' },
  { label: 'Equilibrado', value: 'Distribucion equilibrada entre operativo, inversion y mantenimiento', color: 'green' },
  { label: 'Austeridad', value: 'Plan austero, solo lo estrictamente necesario para operar', color: 'orange' },
];

const TIMELINE_OPTIONS: QuickOption[] = [
  { label: 'Primer trimestre (ene-mar)', value: 'La mayoria de contrataciones deben iniciarse en el primer trimestre (enero-marzo)', color: 'blue' },
  { label: 'Distribuido todo el anio', value: 'Distribuir las contrataciones uniformemente durante todo el anio fiscal', color: 'green' },
  { label: 'Segundo semestre (jul-dic)', value: 'Las contrataciones principales se concentran en el segundo semestre (julio-diciembre)', color: 'orange' },
  { label: 'Segun urgencia', value: 'Planificar segun urgencia de cada necesidad, sin patron fijo', color: 'purple' },
];

const STEP_PROGRESS: Record<WizardStep, number> = {
  WELCOME: 0, ENTITY_NAME: 10, ENTITY_VALIDATING: 15, ENTITY_RUC: 20, SECTOR: 30,
  BUDGET: 40, DEPARTMENTS_SUGGESTING: 48, DEPARTMENTS: 50, NEEDS: 60, NEEDS_ENRICHING: 65,
  NEEDS_CLARIFYING: 68, NEEDS_ENRICHED: 75, NEEDS_REFINING: 70, PRIORITIES: 85,
  GENERATING: 95, PROPOSAL: 100,
};

const STEP_LABELS: Record<WizardStep, string> = {
  WELCOME: 'Inicio', ENTITY_NAME: 'Entidad', ENTITY_VALIDATING: 'Verificando entidad...',
  ENTITY_RUC: 'RUC',
  SECTOR: 'Sector', BUDGET: 'Presupuesto', DEPARTMENTS_SUGGESTING: 'Consultando estructura...',
  DEPARTMENTS: 'Departamentos',
  NEEDS: 'Necesidades', NEEDS_ENRICHING: 'IA analizando y mejorando...',
  NEEDS_CLARIFYING: 'Preguntas de clarificacion', NEEDS_ENRICHED: 'Propuesta de items',
  NEEDS_REFINING: 'Refinando propuesta...',
  PRIORITIES: 'Prioridades', GENERATING: 'Generando PAA final...',
  PROPOSAL: 'Propuesta lista',
};

let msgIdCounter = 0;
const nextId = () => `msg-${++msgIdCounter}`;

// ============================================================================
// COMPONENT
// ============================================================================

export const CPPAAWizardChat: React.FC<CPPAAWizardChatProps> = ({
  fiscalYear,
  workspaceId,
  departmentPlanId,
  departmentName: presetDepartmentName,
  entityName: presetEntityName,
  entityRuc: presetEntityRuc,
  onCreatePAA,
  onSubmitDepartmentPlan,
  defaultExpanded,
}) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(defaultExpanded ?? false);
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<WizardStep>('WELCOME');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wizardData, setWizardData] = useState<PAAWizardData>({
    entityName: presetEntityName || '', entityRuc: presetEntityRuc || '',
    sector: '', sectorLabel: '',
    missionSummary: '', totalBudget: 0, departments: [], needs: '',
    enrichedNeeds: '', needsValidated: false,
    priorities: '', timeline: '',
  });
  const [proposalResponse, setProposalResponse] = useState<CPLegalHelpResponse | null>(null);
  const [deptInput, setDeptInput] = useState('');

  // Methodology state (loaded from BD)
  const [methodologies, setMethodologies] = useState<CPPAAMethodology[]>([]);
  const [selectedMethodology, setSelectedMethodology] = useState<CPPAAMethodology | null>(null);
  const [phaseResults, setPhaseResults] = useState<Record<string, PhaseResult>>({});
  const [currentPhaseCode, setCurrentPhaseCode] = useState<string | null>(null);
  const [methodologyLoaded, setMethodologyLoaded] = useState(false);
  const isWorkspaceMode = !!workspaceId;

  const cardBg = isDark ? 'gray.800' : 'white';
  const cardBorder = isDark ? 'gray.700' : 'gray.200';
  const userBubbleBg = isDark ? 'blue.900' : 'blue.50';
  const botBubbleBg = isDark ? 'gray.750' : 'gray.50';
  const warningBubbleBg = isDark ? 'orange.900' : 'orange.50';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isTyping) setTimeout(() => inputRef.current?.focus(), 300);
  }, [currentStep, isTyping]);

  // Load methodologies from BD
  useEffect(() => {
    getActiveMethodologies()
      .then((meths) => {
        setMethodologies(meths);
        // Auto-select default methodology
        const defaultMeth = meths.find(m => m.isDefault) || meths[0];
        if (defaultMeth) {
          setSelectedMethodology(defaultMeth);
          // Initialize phase results as pending
          const initialResults: Record<string, PhaseResult> = {};
          defaultMeth.phases.forEach(phase => {
            initialResults[phase.phaseCode] = { phaseCode: phase.phaseCode, status: 'pending' };
          });
          setPhaseResults(initialResults);
        }
        setMethodologyLoaded(true);
      })
      .catch(() => {
        setMethodologyLoaded(true); // proceed without methodology
      });
  }, []);

  // Helper to update phase result in dashboard
  const updatePhaseResult = useCallback((phaseCode: string, result: Partial<PhaseResult>) => {
    setPhaseResults(prev => ({
      ...prev,
      [phaseCode]: { ...prev[phaseCode], phaseCode, ...result } as PhaseResult,
    }));
  }, []);

  // Map wizard steps to methodology phase codes
  const mapStepToPhase = useCallback((step: WizardStep): string | null => {
    const stepPhaseMap: Record<string, string> = {
      ENTITY_NAME: 'CONTEXTO_INSTITUCIONAL',
      ENTITY_VALIDATING: 'CONTEXTO_INSTITUCIONAL',
      ENTITY_RUC: 'CONTEXTO_INSTITUCIONAL',
      SECTOR: 'CONTEXTO_INSTITUCIONAL',
      BUDGET: 'MARCO_PRESUPUESTARIO',
      DEPARTMENTS_SUGGESTING: 'MARCO_PRESUPUESTARIO',
      DEPARTMENTS: 'MARCO_PRESUPUESTARIO',
      NEEDS: 'LEVANTAMIENTO_NECESIDADES',
      NEEDS_ENRICHING: 'LEVANTAMIENTO_NECESIDADES',
      NEEDS_CLARIFYING: 'LEVANTAMIENTO_NECESIDADES',
      NEEDS_ENRICHED: 'LEVANTAMIENTO_NECESIDADES',
      NEEDS_REFINING: 'LEVANTAMIENTO_NECESIDADES',
      PRIORITIES: 'ESTRATEGIA_CONTRATACION',
      GENERATING: 'CALENDARIZACION_VALIDACION',
      PROPOSAL: 'CALENDARIZACION_VALIDACION',
    };
    return stepPhaseMap[step] || null;
  }, []);

  // Update dashboard when step changes
  useEffect(() => {
    const phaseCode = mapStepToPhase(currentStep);
    if (phaseCode) {
      setCurrentPhaseCode(phaseCode);
      // Mark current phase as active if not completed
      if (phaseResults[phaseCode]?.status !== 'completed') {
        updatePhaseResult(phaseCode, { status: 'active' });
      }
    }
  }, [currentStep, mapStepToPhase, updatePhaseResult]);

  // Persist phase data to backend when phase transitions (workspace mode only)
  useEffect(() => {
    if (!departmentPlanId) return;
    const phaseCode = mapStepToPhase(currentStep);
    if (!phaseCode) return;
    const phaseIndex = selectedMethodology?.phases.findIndex(p => p.phaseCode === phaseCode) ?? -1;
    if (phaseIndex < 0) return;
    const result = phaseResults[phaseCode];
    if (result?.status === 'completed' || result?.status === 'active') {
      updatePhaseData(
        Number(departmentPlanId),
        phaseIndex + 1,
        JSON.stringify({ phaseCode, step: currentStep, data: wizardData })
      ).catch(err => console.error('Failed to persist phase data:', err));
    }
  }, [currentStep, departmentPlanId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addBotMessage = useCallback((content: string, options?: QuickOption[], extra?: Partial<WizardMessage>) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content, options, ...extra }]);
      setIsTyping(false);
    }, 500);
  }, []);

  const addBotMessageImmediate = useCallback((content: string, options?: QuickOption[], extra?: Partial<WizardMessage>) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'assistant', content, options, ...extra }]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, { id: nextId(), role: 'user', content }]);
  }, []);

  // ============================================================================
  // AI ENTITY VALIDATION - checks if entity name is a real/plausible institution
  // ============================================================================

  const validateEntity = useCallback(async (entityName: string) => {
    setCurrentStep('ENTITY_VALIDATING');
    setIsTyping(true);

    try {
      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_ENTITY_VALIDATION',
        fieldId: 'ENTITY_CHECK',
        question: `VALIDACION COMPLETA DE ENTIDAD CONTRATANTE para un PAA segun la LOSNCP ecuatoriana.

NOMBRE INGRESADO: "${entityName}"

Determina si este nombre corresponde a una entidad del sector publico ecuatoriano REAL o PLAUSIBLE segun el Art. 1 de la LOSNCP.

====================================================================
SI LA ENTIDAD ES REAL O PLAUSIBLE:
====================================================================
- En "title" pon "ENTIDAD VALIDA"
- En "content" escribe un PERFIL INSTITUCIONAL breve (4-6 lineas) que incluya:
  * Tipo de entidad (ministerio, GAD, hospital, universidad, empresa publica, etc.)
  * Mision institucional resumida
  * Principales areas de accion
  * Como deben alinearse las compras publicas con su mision (ej: para un ministerio de salud, las compras deben orientarse a medicamentos, insumos medicos, equipamiento hospitalario, infraestructura sanitaria, etc.)

- En "examples" pon EXACTAMENTE 4 elementos:
  * examples[0]: NOMBRE OFICIAL COMPLETO corregido (mayusculas, tildes, nombre completo)
  * examples[1]: RUC si lo conoces (13 digitos) o "DESCONOCIDO"
  * examples[2]: SECTOR (usa exactamente uno de: SALUD, EDUCACION, INFRAESTRUCTURA, TECNOLOGIA, GOBIERNO, SEGURIDAD, TRANSPORTE, OTRO)
  * examples[3]: Etiqueta descriptiva del sector (ej: "Salud Publica", "Educacion", "Gobierno y Administracion")

RUCS CONOCIDOS:
- Ministerio de Salud Publica: 1760013210001
- Ministerio de Educacion: 1760013370001
- Ministerio de Finanzas: 1760013490001
- Ministerio de Defensa Nacional: 1760013280001
- Ministerio del Interior: 1760013300001
- Ministerio de Obras Publicas y Transporte: 1760013460001
- Ministerio de Inclusion Economica y Social (MIES): 1760013350001
- Ministerio del Ambiente, Agua y Transicion Ecologica: 1760013400001
- Ministerio de Agricultura y Ganaderia: 1760013430001
- Ministerio de Trabajo: 1760013520001
- Ministerio de Telecomunicaciones (MINTEL): 1768149130001
- Ministerio de Energia y Minas: 1760013540001
- Ministerio de Turismo: 1760013510001
- Ministerio de Cultura y Patrimonio: 1760013560001
- Ministerio de Relaciones Exteriores: 1760013240001
- IESS: 1760004000001
- SRI: 1760013450001
- Contraloria General del Estado: 1760005540001
- Asamblea Nacional: 1768151080001
- Consejo de la Judicatura: 1768152490001
- SERCOP: 1768155430001
- Banco Central del Ecuador: 1760002600001
- Petroecuador EP: 1768152940001
- CNEL EP: 1768155820001
- GAD Municipal de Quito: 1760003500001
- GAD Municipal de Guayaquil: 0960000050001
- GAD Municipal de Cuenca: 0160000270001
- Universidad Central del Ecuador: 1760005620001
- Escuela Politecnica Nacional: 1760005690001
- Prefectura de Pichincha: 1760001550001

====================================================================
SI LA ENTIDAD NO EXISTE O ES FICTICIA:
====================================================================
- En "title" pon "ENTIDAD NO RECONOCIDA"
- En "content" explica brevemente por que
- En "tips" sugiere entidades reales similares
- En "examples" pon las entidades sugeridas

====================================================================
SI ES AMBIGUO:
====================================================================
- En "title" pon "ENTIDAD NO VERIFICADA"
- En "content" indica la duda
- En "examples" pon [nombre probable, "DESCONOCIDO", sector probable, etiqueta sector]`,
      });

      setIsTyping(false);

      const isValid = response.title?.toUpperCase().includes('VALIDA');
      const isNotRecognized = response.title?.toUpperCase().includes('NO RECONOCIDA');

      // Extract all data from examples
      const officialName = response.examples?.[0] || entityName;
      const suggestedRuc = response.examples?.[1] || '';
      const suggestedSector = response.examples?.[2] || '';
      const suggestedSectorLabel = response.examples?.[3] || '';
      const hasRuc = suggestedRuc && suggestedRuc !== 'DESCONOCIDO' && /^\d{13}$/.test(suggestedRuc.trim());
      const hasSector = suggestedSector && SECTOR_OPTIONS.some(o => o.value === suggestedSector);

      if (isValid) {
        const displayName = officialName !== entityName ? officialName : entityName;
        const sectorCode = hasSector ? suggestedSector : '';
        const sectorLbl = suggestedSectorLabel || SECTOR_OPTIONS.find(o => o.value === sectorCode)?.label || '';

        // Update dashboard - entity validated
        updatePhaseResult('CONTEXTO_INSTITUCIONAL', {
          status: 'loading',
          subSteps: [
            { label: 'Validando entidad...', status: 'done' },
            { label: 'Identificando sector...', status: 'done' },
            { label: 'Verificando RUC...', status: hasRuc ? 'done' : 'pending' },
          ],
        });
        setTimeout(() => {
          updatePhaseResult('CONTEXTO_INSTITUCIONAL', {
            status: 'completed',
            badges: [
              { label: displayName, color: 'purple' },
              ...(hasRuc ? [{ label: suggestedRuc, color: 'blue' }] : []),
              ...(sectorLbl ? [{ label: sectorLbl, color: 'green' }] : []),
            ],
          });
          updatePhaseResult('DATOS_ENTIDAD', {
            status: 'completed',
            badges: [
              { label: displayName, color: 'purple' },
              ...(hasRuc ? [{ label: suggestedRuc, color: 'blue' }] : []),
              ...(sectorLbl ? [{ label: sectorLbl, color: 'green' }] : []),
            ],
          });
        }, 500);

        // Build a rich confirmation message with mission info
        let confirmMsg = response.content;
        confirmMsg += `\n\nDatos identificados:`;
        confirmMsg += `\n\u2022 Nombre oficial: ${displayName}`;
        if (hasRuc) confirmMsg += `\n\u2022 RUC: ${suggestedRuc}`;
        if (sectorLbl) confirmMsg += `\n\u2022 Sector: ${sectorLbl}`;
        confirmMsg += `\n\n\u00BFSon correctos estos datos?`;

        setCurrentStep('ENTITY_RUC'); // Handled via options
        addBotMessageImmediate(
          confirmMsg,
          [
            {
              label: 'Datos correctos, continuar',
              value: `__confirm_full__${displayName}__${hasRuc ? suggestedRuc : ''}__${sectorCode}__${sectorLbl}`,
              color: 'green',
            },
            { label: 'Corregir nombre', value: '__correct_entity__', color: 'orange' },
            ...(hasRuc ? [{ label: 'Corregir RUC', value: `__correct_ruc__${displayName}`, color: 'orange' as const }] : []),
          ],
        );
      } else if (isNotRecognized) {
        const suggestions = response.tips && response.tips.length > 0
          ? `\n\nEntidades similares que si existen:\n${response.tips.map(t => `\u2022 ${t}`).join('\n')}`
          : '';
        setCurrentStep('ENTITY_NAME');
        addBotMessageImmediate(
          `${response.content}${suggestions}\n\nPor favor ingresa el nombre correcto de una entidad publica ecuatoriana real.`,
          undefined,
          { severity: 'warning' },
        );
      } else {
        // Ambiguous
        setCurrentStep('ENTITY_NAME');
        addBotMessageImmediate(
          `${response.content}\n\nSi el nombre es correcto, escribelo nuevamente para confirmar. Si no, ingresa el nombre correcto.`,
          [
            { label: `Confirmar "${entityName}"`, value: `__confirm_entity__${entityName}`, color: 'green' },
            { label: 'Corregir nombre', value: '__correct_entity__', color: 'orange' },
          ],
          { severity: 'warning' },
        );
      }
    } catch (err) {
      setIsTyping(false);
      setWizardData(prev => ({ ...prev, entityName: entityName }));
      setCurrentStep('ENTITY_RUC');
      addBotMessage(
        `Entidad registrada: "${entityName}" (no se pudo verificar con IA).\n\nIngresa el RUC (13 digitos) o escribe "omitir".`,
      );
    }
  }, [addBotMessage, addBotMessageImmediate]);

  // ============================================================================
  // AI DEPARTMENT SUGGESTION - suggests departments for the entity
  // ============================================================================

  const suggestDepartments = useCallback(async (entityName: string, sector: string, budget: number) => {
    setCurrentStep('DEPARTMENTS_SUGGESTING');
    setIsTyping(true);

    try {
      const sectorLabel = SECTOR_OPTIONS.find(o => o.value === sector)?.label || sector;
      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_DEPARTMENTS',
        fieldId: 'DEPT_SUGGEST',
        budget,
        question: `Para la entidad publica ecuatoriana "${entityName}" del sector ${sectorLabel}, necesito la lista de unidades administrativas/departamentos/direcciones principales que tipicamente generan necesidades de contratacion publica.

INSTRUCCIONES:
- Devuelve en "examples" un array con los nombres FORMALES de los departamentos principales (entre 6 y 15 departamentos)
- Adapta los departamentos al tipo especifico de entidad y sector
- Usa la nomenclatura oficial ecuatoriana (Direccion, Coordinacion, Subsecretaria, etc.)
- Incluye siempre las areas transversales: Administrativa, Financiera, Talento Humano, TI, Planificacion
- Agrega las areas misionales especificas del sector

Por ejemplo para un Ministerio de Salud:
["Subsecretaria de Vigilancia de la Salud Publica", "Subsecretaria de Promocion de la Salud", "Coordinacion General Administrativa Financiera", "Direccion de Talento Humano", "Direccion de Tecnologias de la Informacion y Comunicaciones", "Direccion de Planificacion e Inversion", "Direccion de Comunicacion Social", "Coordinacion General de Asesoria Juridica", "Direccion de Infraestructura Sanitaria", "Direccion Nacional de Medicamentos e Insumos", "Direccion de Control Sanitario"]

En "content" pon una breve explicacion (1-2 lineas) de por que se sugieren estos departamentos.

IMPORTANTE: Devuelve SOLO nombres de departamentos reales y formales en "examples". No incluyas explicaciones en ese campo.`,
      });

      setIsTyping(false);

      const suggestedDepts = response.examples?.filter(e => e && e.trim().length > 2) || [];

      if (suggestedDepts.length > 0) {
        setWizardData(prev => ({ ...prev, departments: suggestedDepts }));
        setCurrentStep('DEPARTMENTS');
        addBotMessageImmediate(
          `${response.content || `Basado en la estructura de "${entityName}", sugiero estos departamentos:`}

${suggestedDepts.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Si la lista esta completa, presiona "Listo". Tambien puedes escribir departamentos adicionales.`,
        );
      } else {
        // Fallback to manual entry
        setCurrentStep('DEPARTMENTS');
        addBotMessage(
          `Indica los departamentos de "${entityName}" que generan necesidades de contratacion. Escribe uno por uno y presiona Enter.

Cuando hayas ingresado todos, presiona "Listo".`,
        );
      }
    } catch {
      setIsTyping(false);
      setCurrentStep('DEPARTMENTS');
      addBotMessage(
        `Indica los departamentos de "${entityName}" que generan necesidades de contratacion. Escribe uno por uno y presiona Enter.

Cuando hayas ingresado todos, presiona "Listo".`,
      );
    }
  }, [addBotMessage, addBotMessageImmediate]);

  // ============================================================================
  // AI ENRICHMENT - takes rough description, returns professional items list
  // ============================================================================

  const enrichNeeds = useCallback(async (userInput: string, data: PAAWizardData, isRefinement: boolean) => {
    setCurrentStep('NEEDS_ENRICHING');
    setIsTyping(true);

    try {
      const sectorLabel = data.sectorLabel || SECTOR_OPTIONS.find(o => o.value === data.sector)?.label || data.sector;

      const refinementContext = isRefinement
        ? `MODO: REFINAMIENTO DE PROPUESTA EXISTENTE.
El usuario ya reviso una propuesta anterior y pide estos cambios.

PROPUESTA ANTERIOR:
${data.enrichedNeeds}

CAMBIOS SOLICITADOS:
"${userInput}"

Aplica SOLO los cambios solicitados. Mantiene los items no mencionados. Genera la tabla completa actualizada.`
        : `MODO: ANALISIS DE DESCRIPCION INICIAL.
DESCRIPCION DEL USUARIO:
"${userInput}"`;

      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_NEEDS_ENRICHMENT',
        fieldId: 'NEEDS_ENRICH',
        budget: data.totalBudget,
        question: `ERES UN CONSULTOR EXPERTO EN CONTRATACION PUBLICA ECUATORIANA. Tu trabajo es generar items CONCRETOS para un PAA.

${refinementContext}

CONTEXTO:
- Entidad: ${data.entityName}
- Sector: ${sectorLabel}
- Presupuesto: $${data.totalBudget.toLocaleString('es-EC')}
- Departamentos: ${data.departments.join(', ')}
- Anio fiscal: ${fiscalYear}

====================================================================
REGLA CRITICA - DECIDE ENTRE DOS MODOS DE RESPUESTA:
====================================================================

EVALUA si la descripcion del usuario tiene suficiente detalle para generar items concretos.

**SI LA DESCRIPCION ES VAGA O INCOMPLETA** (ej: "sistema para hospitales", "equipos", "necesitamos cosas"):
- En "title" pon exactamente: "CLARIFICACION NECESARIA"
- En "content" pon 4-6 PREGUNTAS ESPECIFICAS Y NUMERADAS que necesitas que responda para poder generar items concretos. Las preguntas deben ser sobre:
  * Que bienes/productos especificos necesita (marcas, especificaciones, cantidades)
  * Que servicios requiere (alcance, frecuencia, cobertura)
  * Que obras o consultoria necesita (descripcion, plazos)
  * Que areas/departamentos son los principales demandantes
  * Presupuesto aproximado por categoria si lo tiene
- En "tips" pon ejemplos de respuestas buenas para guiar al usuario
- NO generes items si no tienes suficiente informacion. Es MEJOR preguntar que inventar.

**SI LA DESCRIPCION TIENE SUFICIENTE DETALLE** (menciona bienes, servicios u obras concretas con algo de especificidad):
- En "title" pon exactamente: "PROPUESTA PAA ${fiscalYear}"
- En "content" genera una TABLA OBLIGATORIA con este formato EXACTO:

ITEMS PROPUESTOS:

# | CPC | Descripcion | Tipo | Regimen | Procedimiento | Cant | U.Medida | C.Unit. | Total | Depto | Periodo
1 | [codigo real] | [descripcion tecnica profesional] | B/S/O/C | Comun/Especial | [proceso LOSNCP] | [n] | [unidad] | $[monto] | $[total] | [depto] | Q1/Q2/Q3/Q4
2 | ...

ITEMS ADICIONALES RECOMENDADOS:
[items tipicos del sector ${sectorLabel} que no fueron mencionados]

RESUMEN: [n] items por $[total]

REGLAS PARA GENERAR ITEMS:
- CADA item debe tener un codigo CPC real (6 digitos)
- CADA item debe tener un monto en dolares
- Umbrales LOSNCP/PIE 2024: Infima hasta $7,263 / Menor Cuantia B/S hasta $72,634 / Cotizacion hasta $544,758 / Licitacion mayor / Subasta Inversa para normalizados / Catalogo Electronico si esta en SERCOP
- Los totales deben sumar aprox. $${data.totalBudget.toLocaleString('es-EC')}
- No fraccionamiento (Art. 62 LOSNCP)
- Transforma descripciones vagas en especificaciones tecnicas (ej: "computadoras" → "Equipos de computo All-in-One, Intel Core i5, 16GB RAM, 512GB SSD, pantalla 23.8 pulgadas")

En "tips": recomendaciones concretas.
En "requirements": items que necesitan mas detalle.
En "commonErrors": problemas detectados (fraccionamiento, items no contratables).
En "legalReferences": normas LOSNCP aplicables.

====================================================================
NUNCA respondas con texto teorico, explicaciones generales, o pasos a seguir.
SIEMPRE responde con UNA de las dos opciones: TABLA DE ITEMS o PREGUNTAS DE CLARIFICACION.
====================================================================`,
      });

      setIsTyping(false);

      // ── Detect if AI is asking for clarification instead of generating items ──
      const isClarification = response.title?.toUpperCase().includes('CLARIFICACION');
      // Also detect if the response lacks actual items (no CPC codes or dollar amounts in table format)
      const hasItemsTable = /\d+\s*\|\s*\d{4,6}/.test(response.content) || /\$[\d,.]+/.test(response.content);
      const needsClarification = isClarification || (!hasItemsTable && !isRefinement);

      if (needsClarification) {
        // AI needs more info - show questions and go to clarification mode
        setCurrentStep('NEEDS_CLARIFYING');

        let clarifyMsg = `Necesito mas informacion para generar items concretos del PAA.\n\n${response.content}`;

        if (response.tips && response.tips.length > 0) {
          clarifyMsg += `\n\n\u{1F4A1} Ejemplos de buenas respuestas:\n${response.tips.map(t => `\u2022 ${t}`).join('\n')}`;
        }

        clarifyMsg += '\n\nResponde a las preguntas anteriores en un solo mensaje. Con esa informacion podre generar los items del PAA.';

        addBotMessageImmediate(clarifyMsg, undefined, { severity: 'info' });
      } else {
        // AI generated concrete items - show proposal
        const hasErrors = response.commonErrors && response.commonErrors.length > 0;

        setWizardData(prev => ({ ...prev, enrichedNeeds: response.content }));
        setCurrentStep('NEEDS_ENRICHED');

        // Update dashboard - items generated
        const itemCount = (response.content.match(/^\d+\s*\|/gm) || []).length;
        const totalMatch = response.content.match(/\$[\d,]+(?:\.\d{2})?/g);
        const lastTotal = totalMatch ? totalMatch[totalMatch.length - 1] : '';
        updatePhaseResult('LEVANTAMIENTO_NECESIDADES', {
          status: 'completed',
          stats: [
            { label: 'Items', value: itemCount },
            ...(lastTotal ? [{ label: 'Total', value: lastTotal }] : []),
          ],
          legalRefs: response.legalReferences?.map(r => ({
            article: r.article || r.law,
            summary: r.summary || '',
          })),
        });
        updatePhaseResult('NECESIDADES_PRESUPUESTO', {
          status: 'completed',
          stats: [
            { label: 'Items', value: itemCount },
            ...(lastTotal ? [{ label: 'Total', value: lastTotal }] : []),
          ],
        });

        let enrichedMsg = `Propuesta de items para el PAA:\n\n${response.content}`;

        if (response.tips && response.tips.length > 0) {
          enrichedMsg += `\n\n\u{1F4A1} Recomendaciones:\n${response.tips.map(t => `\u2022 ${t}`).join('\n')}`;
        }

        if (response.requirements && response.requirements.length > 0) {
          enrichedMsg += `\n\n\u{1F4CB} Items que podrian detallarse mas:\n${response.requirements.map(r => `\u2022 ${r}`).join('\n')}`;
        }

        if (hasErrors) {
          enrichedMsg += `\n\n\u26A0\uFE0F Problemas detectados:\n${response.commonErrors.map(e => `\u2022 ${e}`).join('\n')}`;
        }

        enrichedMsg += '\n\n\u00BFQue te parece esta propuesta?';

        addBotMessageImmediate(
          enrichedMsg,
          [
            { label: 'Aprobar y continuar', value: '__approve_enriched__', color: 'green' },
            { label: 'Modificar propuesta', value: '__refine_needs__', color: 'orange' },
            { label: 'Agregar mas necesidades', value: '__add_more_needs__', color: 'blue' },
            { label: 'Empezar de cero', value: '__redo_needs__', color: 'red' },
          ],
          { severity: hasErrors ? 'warning' : 'info' },
        );
      }
    } catch (err) {
      setIsTyping(false);
      setCurrentStep('NEEDS');
      addBotMessage(
        `No se pudo procesar con IA (${err instanceof Error ? err.message : 'error'}). Intenta de nuevo o describe tus necesidades de otra forma.`,
        undefined,
        { severity: 'error' },
      );
    }
  }, [addBotMessage, addBotMessageImmediate, fiscalYear]);

  // ============================================================================
  // PROCESS INPUT
  // ============================================================================

  const processInput = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed && currentStep !== 'DEPARTMENTS') return;

    switch (currentStep) {
      case 'ENTITY_NAME': {
        if (trimmed.length < 5) {
          addUserMessage(trimmed);
          addBotMessage('El nombre de la entidad debe ser completo y formal. Ejemplo: "Gobierno Autonomo Descentralizado del Canton Quito". Intenta de nuevo.', undefined, { severity: 'warning' });
          return;
        }
        const looksInstitutional = /[a-záéíóúñ]{3,}/i.test(trimmed) && trimmed.split(/\s+/).length >= 2;
        if (!looksInstitutional) {
          addUserMessage(trimmed);
          addBotMessage('Necesito el nombre completo y oficial de la entidad contratante del sector publico. Ejemplos:\n\u2022 "Ministerio de Educacion"\n\u2022 "Hospital General IESS Quito Sur"\n\u2022 "Universidad Central del Ecuador"\n\nPor favor ingresa el nombre completo.', undefined, { severity: 'warning' });
          return;
        }
        addUserMessage(trimmed);
        // Validate entity name with AI
        await validateEntity(trimmed);
        break;
      }

      case 'ENTITY_RUC': {
        addUserMessage(trimmed);
        if (trimmed.toLowerCase() !== 'omitir') {
          const rucClean = trimmed.replace(/\D/g, '');
          if (rucClean.length !== 13) {
            addBotMessage('El RUC ecuatoriano debe tener exactamente 13 digitos. Verifica e intenta de nuevo, o escribe "omitir".', undefined, { severity: 'warning' });
            return;
          }
          if (!rucClean.endsWith('001')) {
            addBotMessage('El RUC de entidades publicas ecuatorianas generalmente termina en "001". Verifica que sea correcto, o escribe "omitir".', undefined, { severity: 'warning' });
            return;
          }
          setWizardData(prev => ({ ...prev, entityRuc: rucClean }));
        } else {
          setWizardData(prev => ({ ...prev, entityRuc: '' }));
        }
        setCurrentStep('SECTOR');
        addBotMessage(
          '\u00BFEn que sector opera la entidad? Esto me ayudara a sugerir items de contratacion tipicos para tu tipo de institucion.',
          SECTOR_OPTIONS,
        );
        break;
      }

      case 'SECTOR': {
        const sectorLabel = SECTOR_OPTIONS.find(o => o.value === trimmed)?.label || trimmed;
        addUserMessage(sectorLabel);
        setWizardData(prev => ({ ...prev, sector: trimmed }));
        setCurrentStep('BUDGET');
        addBotMessage(
          `Sector: ${sectorLabel}.

Ingresa el presupuesto referencial anual para contrataciones (en dolares).
Este monto determina los tipos de proceso aplicables segun los umbrales de la LOSNCP:

\u2022 Infima Cuantia: hasta ~$7,263 (0.0000002 del PIE)
\u2022 Menor Cuantia: hasta ~$72,636 (0.000002 del PIE)
\u2022 Cotizacion: hasta ~$544,773 (0.000015 del PIE)
\u2022 Licitacion: mayor a $544,773
\u2022 Subasta Inversa: para bienes/servicios normalizados

Ingresa el monto total (solo numeros):`,
        );
        break;
      }

      case 'BUDGET': {
        const amount = parseFloat(trimmed.replace(/[,$.\s]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          addUserMessage(trimmed);
          addBotMessage('Ingresa un monto valido en dolares. Solo numeros. Ejemplo: 500000', undefined, { severity: 'warning' });
          return;
        }
        if (amount < 1000) {
          addUserMessage(trimmed);
          addBotMessage('El presupuesto parece muy bajo para un PAA. El PAA cubre las contrataciones anuales de la entidad. \u00BFEstas seguro? Ingresa el monto correcto.', undefined, { severity: 'warning' });
          return;
        }
        addUserMessage(`$${amount.toLocaleString('es-EC')}`);
        setWizardData(prev => ({ ...prev, totalBudget: amount }));
        // Update dashboard - budget phase
        updatePhaseResult('MARCO_PRESUPUESTARIO', {
          status: 'completed',
          stats: [
            { label: 'Presupuesto', value: amount, prefix: '$' },
          ],
        });
        updatePhaseResult('NECESIDADES_PRESUPUESTO', {
          status: 'active',
        });
        // Ask AI to suggest departments for this entity
        addBotMessageImmediate(`Presupuesto registrado: $${amount.toLocaleString('es-EC')}. Consultando la estructura organizacional...`);
        await suggestDepartments(wizardData.entityName, wizardData.sector, amount);
        break;
      }

      case 'DEPARTMENTS': {
        if (trimmed.toLowerCase() === 'listo' && wizardData.departments.length > 0) {
          addUserMessage(`Departamentos: ${wizardData.departments.join(', ')}`);
          const sectorLabel = wizardData.sectorLabel || SECTOR_OPTIONS.find(o => o.value === wizardData.sector)?.label || wizardData.sector;
          setCurrentStep('NEEDS');
          addBotMessage(
            `${wizardData.departments.length} departamentos registrados.

Ahora describe las necesidades de contratacion de la entidad. Puedes ser general - yo me encargo de profesionalizar tu descripcion, asignar codigos CPC, estimar cantidades y costos, y sugerir items adicionales.

Escribe de forma natural, por ejemplo:
"Necesitamos computadoras nuevas, servicio de limpieza, mantenimiento de vehiculos, seguro institucional, y una consultoria para actualizar el plan estrategico"

Yo lo convertire en una propuesta profesional con items detallados, precios de mercado y los procedimientos de contratacion correctos segun la LOSNCP para el sector ${sectorLabel}.`,
          );
        } else if (trimmed.toLowerCase() !== 'listo' && trimmed) {
          if (trimmed.length < 3) {
            addUserMessage(trimmed);
            addBotMessage('El nombre del departamento es muy corto. Usa el nombre completo, ej: "Direccion Administrativa".', undefined, { severity: 'warning' });
            return;
          }
          setWizardData(prev => ({
            ...prev,
            departments: [...prev.departments, trimmed],
          }));
          addUserMessage(trimmed);
          addBotMessage(`"${trimmed}" registrado. Agrega otro departamento o presiona "Listo".`);
        }
        break;
      }

      case 'NEEDS': {
        if (trimmed.length < 15) {
          addUserMessage(trimmed);
          addBotMessage('Necesito un poco mas de detalle. Escribe al menos una oracion describiendo que bienes, servicios u obras necesita la entidad. Yo me encargo de expandirlo.', undefined, { severity: 'warning' });
          return;
        }
        // Check that the description contains at least one concrete noun (bien, servicio, obra)
        // This prevents garbage like "necesitamos compre" from going to the AI
        const words = trimmed.toLowerCase().split(/\s+/);
        const concreteNouns = /\b(computador|equipo|vehiculo|mueble|silla|escritorio|impresora|servidor|tablet|laptop|telefono|proyector|aire|acondicionado|medicamento|insumo|material|suministro|papel|toner|uniforme|herramienta|maquinaria|limpieza|seguridad|vigilancia|internet|telefonia|transporte|combustible|mantenimiento|reparacion|consultoria|asesoria|capacitacion|auditoria|estudio|diseno|obra|construccion|remodelacion|pintura|instalacion|seguro|poliza|alquiler|arriendo|licencia|software|sistema|catering|alimentacion|laboratorio|reactivo|ambulancia|mobiliario|generador|bomba|tuberia|cableado|red|fibra|camara|gps|radio)\b/i;
        const hasConcreteItem = concreteNouns.test(trimmed);
        const hasMinWords = words.length >= 3;
        const looksLikeList = /[,;]/.test(trimmed) || words.length >= 5;
        const hasActionableContent = hasConcreteItem || (hasMinWords && looksLikeList);

        if (!hasActionableContent) {
          addUserMessage(trimmed);
          addBotMessage(
            `Tu descripcion no menciona bienes, servicios u obras concretas que pueda convertir en items del PAA.

Necesito que menciones QUE necesita contratar la entidad. Ejemplos:
\u2022 "Computadoras, impresoras y muebles de oficina"
\u2022 "Servicio de limpieza, seguridad y mantenimiento de vehiculos"
\u2022 "Consultoria para plan estrategico y capacitacion del personal"
\u2022 "Insumos medicos, medicamentos y equipos de laboratorio"

Escribe las necesidades reales:`,
            undefined,
            { severity: 'warning' },
          );
          return;
        }
        addUserMessage(trimmed);
        // Accumulate raw needs
        const combinedNeeds = wizardData.needs
          ? wizardData.needs + '\n' + trimmed
          : trimmed;
        setWizardData(prev => ({ ...prev, needs: combinedNeeds }));
        // Send to AI for enrichment (not refinement - fresh analysis of user input)
        await enrichNeeds(trimmed, { ...wizardData, needs: combinedNeeds }, false);
        break;
      }

      case 'NEEDS_CLARIFYING': {
        if (trimmed.length < 15) {
          addUserMessage(trimmed);
          addBotMessage('Necesito respuestas mas detalladas para poder generar los items. Intenta responder las preguntas con mas detalle.', undefined, { severity: 'warning' });
          return;
        }
        addUserMessage(trimmed);
        // Combine original needs + clarification answers and re-enrich
        const enrichedDescription = wizardData.needs
          ? `${wizardData.needs}\n\nDETALLES ADICIONALES:\n${trimmed}`
          : trimmed;
        setWizardData(prev => ({ ...prev, needs: enrichedDescription }));
        await enrichNeeds(enrichedDescription, { ...wizardData, needs: enrichedDescription }, false);
        break;
      }

      case 'NEEDS_REFINING': {
        if (trimmed.length < 5) {
          addUserMessage(trimmed);
          addBotMessage('Describe que cambios quieres. Ej: "Quitar las computadoras y agregar tablets", "Subir el monto de limpieza a $50,000", "Agregar un item de capacitacion".', undefined, { severity: 'warning' });
          return;
        }
        addUserMessage(trimmed);
        // Send refinement request - AI will modify the existing proposal
        await enrichNeeds(trimmed, wizardData, true);
        break;
      }

      case 'PRIORITIES': {
        const prioLabel = PRIORITY_OPTIONS.find(o => o.value === trimmed)?.label || trimmed;
        addUserMessage(prioLabel);
        setWizardData(prev => ({ ...prev, priorities: trimmed }));
        addBotMessage(
          '\u00BFComo prefieres distribuir las contrataciones durante el anio fiscal?',
          TIMELINE_OPTIONS,
        );
        setCurrentStep('GENERATING');
        break;
      }

      default:
        break;
    }

    setInputValue('');
    setDeptInput('');
  }, [currentStep, wizardData, addBotMessage, addBotMessageImmediate, addUserMessage, validateEntity, suggestDepartments, enrichNeeds]);

  // ============================================================================
  // GENERATE PROPOSAL
  // ============================================================================

  const handleTimelineAndGenerate = useCallback(async (timelineValue: string) => {
    const timeLabel = TIMELINE_OPTIONS.find(o => o.value === timelineValue)?.label || timelineValue;
    addUserMessage(timeLabel);

    const finalData = { ...wizardData, timeline: timelineValue };
    setWizardData(finalData);
    setCurrentStep('GENERATING');

    setMessages(prev => [...prev, {
      id: nextId(), role: 'assistant',
      content: 'Generando propuesta final del PAA con todos los items aprobados...',
    }]);
    setIsTyping(true);

    try {
      const sectorLabel = finalData.sectorLabel || SECTOR_OPTIONS.find(o => o.value === finalData.sector)?.label || finalData.sector;
      const response = await getLegalHelp({
        processType: 'PAA',
        currentStep: 'PAA_GENERATION',
        fieldId: 'FULL_PAA_PROPOSAL',
        budget: finalData.totalBudget,
        question: `GENERA LA VERSION FINAL DEL PLAN ANUAL DE ADQUISICIONES (PAA) segun la LOSNCP ecuatoriana.

ENTIDAD: ${finalData.entityName}
RUC: ${finalData.entityRuc || 'No proporcionado'}
SECTOR: ${sectorLabel}
AÑO FISCAL: ${fiscalYear}
PRESUPUESTO TOTAL: $${finalData.totalBudget.toLocaleString('es-EC')}
DEPARTAMENTOS: ${finalData.departments.join(', ')}

ITEMS YA APROBADOS POR EL USUARIO (propuesta enriquecida por IA y aceptada):
${finalData.enrichedNeeds}

ENFOQUE DE PRIORIDADES: ${finalData.priorities}
CRONOGRAMA PREFERIDO: ${finalData.timeline}

GENERA EL PAA FINAL con formato SERCOP:
1. Para cada item incluye TODAS las columnas del formato oficial SERCOP:
   - Nro (secuencial)
   - Partida Presupuestaria (codigo presupuestario sugerido)
   - CPC (Clasificacion Central de Productos)
   - Tipo de Compra (Bien/Servicio/Obra/Consultoria)
   - Tipo de Regimen (Comun/Especial)
   - Catalogo Electronico (Si/No)
   - Procedimiento sugerido segun umbrales LOSNCP/PIE
   - Descripcion completa y profesional
   - Cantidad
   - Unidad de Medida
   - Costo Unitario estimado
   - Valor Total
   - Periodo (Q1/Q2/Q3/Q4)

2. VALIDACIONES FINALES:
   - Verifica no fraccionamiento (Art. 62 LOSNCP)
   - Verifica umbrales vs tipos de proceso
   - Verifica que el total se aproxime al presupuesto
   - Verifica coherencia sector-items
   - Identifica items susceptibles de Catalogo Electronico

3. RESUMEN EJECUTIVO al inicio:
   - Total de items
   - Distribucion por tipo (bienes/servicios/obras/consultoria)
   - Distribucion por proceso
   - Distribucion por trimestre
   - Monto total

4. NOTAS LEGALES al final:
   - Resoluciones SERCOP aplicables
   - Plazos de publicacion
   - Requisitos de aprobacion del PAA

Responde en español con formato profesional.`,
      });

      setProposalResponse(response);
      setIsTyping(false);
      setCurrentStep('PROPOSAL');

      // Update all remaining dashboard phases as completed
      ['INTELIGENCIA_MERCADO', 'CONSOLIDACION_CATEGORIAS', 'ESTRATEGIA_CONTRATACION', 'CALENDARIZACION_VALIDACION', 'CLASIFICACION_PROCEDIMIENTOS', 'REVISION_VALIDACION'].forEach((code, i) => {
        setTimeout(() => {
          updatePhaseResult(code, {
            status: 'completed',
            badges: [{ label: 'Completado', color: 'green' }],
          });
        }, i * 300);
      });

      setMessages(prev => {
        const filtered = prev.slice(0, -1);
        return [...filtered, {
          id: nextId(), role: 'assistant',
          content: `Propuesta final del PAA ${fiscalYear} para "${finalData.entityName}" generada exitosamente.`,
          aiResponse: response,
        }];
      });
    } catch (err) {
      setIsTyping(false);
      setCurrentStep('PRIORITIES');
      addBotMessage(
        `Error al generar: ${err instanceof Error ? err.message : 'Error desconocido'}. \u00BFReintentar?`,
        [{ label: 'Reintentar', value: '__retry__', color: 'purple' }],
      );
    }
  }, [wizardData, fiscalYear, addBotMessage, addUserMessage]);

  // ============================================================================
  // OPTION HANDLERS
  // ============================================================================

  const handleOptionClick = useCallback((value: string) => {
    if (value === '__retry__') {
      handleTimelineAndGenerate(wizardData.timeline);
      return;
    }
    if (value === '__restart__') {
      setMessages([]);
      setCurrentStep('WELCOME');
      setWizardData({
        entityName: '', entityRuc: '', sector: '', sectorLabel: '',
        missionSummary: '', totalBudget: 0, departments: [], needs: '',
        enrichedNeeds: '', needsValidated: false,
        priorities: '', timeline: '',
      });
      setProposalResponse(null);
      setCurrentPhaseCode(null);
      if (selectedMethodology) {
        const resetResults: Record<string, PhaseResult> = {};
        selectedMethodology.phases.forEach(phase => {
          resetResults[phase.phaseCode] = { phaseCode: phase.phaseCode, status: 'pending' };
        });
        setPhaseResults(resetResults);
      }
      msgIdCounter = 0;
      return;
    }

    // --- Entity confirmation options ---
    if (value.startsWith('__confirm_full__')) {
      // Format: __confirm_full__NAME__RUC__SECTOR__SECTORLABEL
      // Parse by splitting on __ (name can't contain __ so this is safe)
      const payload = value.replace('__confirm_full__', '');
      const segments = payload.split('__');
      // Last 3 segments are RUC, SECTOR, SECTORLABEL; everything before is NAME
      const sectorLbl = segments.pop() || '';
      const sectorCode = segments.pop() || '';
      const ruc = segments.pop() || '';
      const confirmedName = segments.join('__'); // rejoin in case name had double underscores
      addUserMessage(`Confirmo: ${confirmedName}${ruc ? ` (RUC: ${ruc})` : ''}${sectorLbl ? ` - ${sectorLbl}` : ''}`);
      setWizardData(prev => ({
        ...prev,
        entityName: confirmedName,
        entityRuc: ruc,
        sector: sectorCode,
        sectorLabel: sectorLbl,
      }));
      // Skip RUC and SECTOR steps → go straight to BUDGET
      setCurrentStep('BUDGET');
      addBotMessage(
        `Perfecto. Ahora ingresa el presupuesto referencial anual para contrataciones (en dolares).

Este monto determina los tipos de proceso aplicables segun los umbrales de la LOSNCP:

\u2022 Infima Cuantia: hasta ~$7,263
\u2022 Menor Cuantia: hasta ~$72,636
\u2022 Cotizacion: hasta ~$544,773
\u2022 Licitacion: mayor a $544,773

Ingresa el monto total (solo numeros):`,
      );
      return;
    }
    if (value.startsWith('__confirm_entity__')) {
      const confirmedName = value.replace('__confirm_entity__', '');
      addUserMessage(`Confirmo: "${confirmedName}"`);
      setWizardData(prev => ({ ...prev, entityName: confirmedName }));
      setCurrentStep('ENTITY_RUC');
      addBotMessage(
        `Entidad confirmada: "${confirmedName}".

Ingresa el RUC de la entidad (13 digitos) o escribe "omitir".`,
      );
      return;
    }
    if (value.startsWith('__correct_ruc__')) {
      const entityForRuc = value.replace('__correct_ruc__', '');
      addUserMessage('Voy a corregir el RUC');
      setWizardData(prev => ({ ...prev, entityName: entityForRuc }));
      setCurrentStep('ENTITY_RUC');
      addBotMessage(`Entidad: "${entityForRuc}". Ingresa el RUC correcto (13 digitos) o escribe "omitir".`);
      return;
    }
    if (value === '__correct_entity__') {
      addUserMessage('Voy a corregir el nombre');
      setCurrentStep('ENTITY_NAME');
      addBotMessage('Ingresa el nombre correcto de la entidad publica:');
      return;
    }

    // --- Enrichment options ---
    if (value === '__approve_enriched__') {
      addUserMessage('Propuesta aprobada, continuar');
      setWizardData(prev => ({ ...prev, needsValidated: true }));
      setCurrentStep('PRIORITIES');
      addBotMessage(
        'Excelente, los items han sido aprobados. Ahora, \u00BFcual es el enfoque de prioridades para distribuir el presupuesto?',
        PRIORITY_OPTIONS,
      );
      return;
    }
    if (value === '__refine_needs__') {
      addUserMessage('Quiero modificar la propuesta');
      setCurrentStep('NEEDS_REFINING');
      addBotMessage(
        'Describe los cambios que necesitas. Puedes pedirme que:\n\n\u2022 Agregue items: "Agrega servicio de transporte por $20,000"\n\u2022 Quite items: "Elimina el item de consultoria"\n\u2022 Modifique montos: "Sube el presupuesto de limpieza a $60,000"\n\u2022 Cambie cantidades: "Necesito 100 computadoras, no 50"\n\u2022 Reasigne departamentos: "El item de capacitacion es para Talento Humano"\n\u2022 Cambie descripciones: "Las computadoras deben ser laptops, no escritorio"\n\nEscribe los cambios:',
      );
      return;
    }
    if (value === '__add_more_needs__') {
      addUserMessage('Quiero agregar mas necesidades');
      setCurrentStep('NEEDS');
      addBotMessage('Describe las necesidades adicionales. Las analizare y agregare a la propuesta existente:');
      return;
    }
    if (value === '__redo_needs__') {
      addUserMessage('Quiero empezar las necesidades desde cero');
      setWizardData(prev => ({ ...prev, needs: '', enrichedNeeds: '' }));
      setCurrentStep('NEEDS');
      addBotMessage('De acuerdo, empecemos de nuevo. Describe las necesidades de contratacion de la entidad:');
      return;
    }

    if (currentStep === 'GENERATING') {
      handleTimelineAndGenerate(value);
      return;
    }
    processInput(value);
  }, [currentStep, processInput, handleTimelineAndGenerate, wizardData.timeline, addBotMessage, addUserMessage]);

  const handleSend = useCallback(() => {
    const val = currentStep === 'DEPARTMENTS' ? (deptInput || inputValue) : inputValue;
    processInput(val);
  }, [currentStep, inputValue, deptInput, processInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle methodology selection change
  const handleMethodologyChange = useCallback((methodologyId: number) => {
    const meth = methodologies.find(m => m.id === methodologyId);
    if (meth) {
      setSelectedMethodology(meth);
      const initialResults: Record<string, PhaseResult> = {};
      meth.phases.forEach(phase => {
        initialResults[phase.phaseCode] = { phaseCode: phase.phaseCode, status: 'pending' };
      });
      setPhaseResults(initialResults);
    }
  }, [methodologies]);

  // Initialize when expanded
  useEffect(() => {
    if (isExpanded && messages.length === 0 && methodologyLoaded) {
      // Build welcome from methodology or fallback
      const welcomeText = selectedMethodology?.welcomeMessage
        || `Bienvenido al Asistente Inteligente para el Plan Anual de Adquisiciones ${fiscalYear}.`;

      const intro = `${welcomeText}

Te guiare paso a paso para construir tu PAA. Funciono como tu consultor experto:

\u2022 Tu describes las necesidades en lenguaje natural
\u2022 Yo las transformo en items profesionales con codigos CPC, precios de mercado y procedimientos LOSNCP
\u2022 Sugiero items adicionales tipicos de tu sector
\u2022 Verifico cumplimiento legal y detecto fraccionamiento
\u2022 Tu apruebas, modificas o agregas hasta quedar conforme

Al final obtendras un PAA completo en formato SERCOP listo para registrar.`;

      if (isWorkspaceMode && presetEntityName) {
        // Workspace mode: pre-fill entity data, skip to needs
        setWizardData(prev => ({
          ...prev,
          entityName: presetEntityName || '',
          entityRuc: presetEntityRuc || '',
        }));
        setMessages([{
          id: nextId(), role: 'assistant',
          content: `${intro}

Modo colaborativo: Departamento "${presetDepartmentName || 'Sin asignar'}" — ${presetEntityName}.

Los datos de la entidad ya estan configurados desde el workspace. Describe las necesidades de contratacion de tu departamento:`,
        }]);
        // Pre-fill entity phase as completed
        updatePhaseResult('CONTEXTO_INSTITUCIONAL', {
          status: 'completed',
          badges: [
            { label: presetEntityName, color: 'purple' },
            ...(presetEntityRuc ? [{ label: presetEntityRuc, color: 'blue' }] : []),
          ],
        });
        setCurrentStep('NEEDS');
      } else {
        setMessages([{
          id: nextId(), role: 'assistant',
          content: `${intro}

\u00BFCual es el nombre oficial completo de la entidad contratante?`,
        }]);
        setCurrentStep('ENTITY_NAME');
      }
    }
  }, [isExpanded, methodologyLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = STEP_PROGRESS[currentStep] || 0;
  const showInput = !['GENERATING', 'PROPOSAL', 'WELCOME', 'ENTITY_VALIDATING', 'DEPARTMENTS_SUGGESTING', 'NEEDS_ENRICHING', 'NEEDS_ENRICHED'].includes(currentStep);
  const showTextarea = currentStep === 'NEEDS' || currentStep === 'NEEDS_CLARIFYING' || currentStep === 'NEEDS_REFINING';

  const getPlaceholder = () => {
    switch (currentStep) {
      case 'ENTITY_NAME': return 'Ej: Gobierno Autonomo Descentralizado del Canton Ambato';
      case 'ENTITY_RUC': return 'Ej: 1860000160001 (o "omitir")';
      case 'BUDGET': return 'Ej: 500000';
      case 'DEPARTMENTS': return 'Ej: Direccion Administrativa';
      case 'NEEDS': return 'Describe las necesidades (puedes ser general, yo lo detallo)...';
      case 'NEEDS_CLARIFYING': return 'Responde las preguntas con el mayor detalle posible...';
      case 'NEEDS_REFINING': return 'Ej: "Agregar tablets en vez de computadoras, subir limpieza a $50,000"';
      default: return 'Escribe tu respuesta...';
    }
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isDark ? 'purple.700' : 'purple.200'}
      overflow="hidden"
      shadow="md"
    >
      {/* Header - clickable to expand/collapse */}
      <Box
        bgGradient={isDark ? 'to-r' : 'to-r'}
        gradientFrom="purple.600"
        gradientTo="blue.600"
        px={4} py={3} color="white"
        cursor="pointer"
        onClick={() => setIsExpanded(prev => !prev)}
        _hover={{ opacity: 0.95 }}
        transition="opacity 0.2s"
      >
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Flex w={9} h={9} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center">
              <Icon as={LuBrain} boxSize={5} />
            </Flex>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" fontSize="sm">Consultor IA - Plan Anual de Adquisiciones {fiscalYear}</Text>
              <Text fontSize="2xs" opacity={0.85}>
                {isExpanded
                  ? `${STEP_LABELS[currentStep]} ${progress > 0 && progress < 100 ? `(${progress}%)` : ''}`
                  : 'Click para abrir el asistente'}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={1}>
            {isExpanded && currentStep === 'PROPOSAL' && (
              <Button size="xs" variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.200' }}
                onClick={(e) => { e.stopPropagation(); handleOptionClick('__restart__'); }}>
                <Icon as={FiRotateCcw} mr={1} /> Nuevo
              </Button>
            )}
            <Flex w={7} h={7} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center">
              <Icon as={isExpanded ? FiChevronUp : FiChevronDown} boxSize={4} />
            </Flex>
          </HStack>
        </Flex>
        {isExpanded && (
          <Box mt={2} h="3px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden">
            <Box h="100%" w={`${progress}%`} bg="whiteAlpha.700" borderRadius="full" transition="width 0.5s ease" />
          </Box>
        )}
      </Box>

      {/* Methodology selector — visible when collapsed and multiple methodologies exist */}
      {!isExpanded && methodologies.length > 1 && (
        <Box px={4} py={2} borderTopWidth="1px" borderColor={cardBorder} bg={isDark ? 'gray.800' : 'white'}>
          <HStack gap={2}>
            <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="nowrap">Metodologia:</Text>
            <NativeSelect.Root size="xs">
              <NativeSelect.Field borderRadius="md" value={selectedMethodology?.id || ''}
                onChange={(e) => handleMethodologyChange(Number(e.target.value))}>
                {methodologies.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.isDefault ? ' (Recomendada)' : ''}</option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </HStack>
        </Box>
      )}

      {/* Main content - only visible when expanded */}
      {isExpanded && (<>
      <Flex direction={{ base: 'column', lg: 'row' }}>
        {/* LEFT: Chat area */}
        <Box flex="1" minW={0}>
          {/* Methodology selector inline when multiple exist */}
          {methodologies.length > 1 && currentStep === 'ENTITY_NAME' && messages.length <= 1 && (
            <Box px={4} py={2} borderBottomWidth="1px" borderColor={cardBorder} bg={isDark ? 'gray.750' : 'gray.50'}>
              <HStack gap={2}>
                <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="nowrap">Metodologia:</Text>
                <NativeSelect.Root size="xs">
                  <NativeSelect.Field borderRadius="md" value={selectedMethodology?.id || ''}
                    onChange={(e) => handleMethodologyChange(Number(e.target.value))}>
                    {methodologies.map(m => (
                      <option key={m.id} value={m.id}>{m.name}{m.isDefault ? ' (Recomendada)' : ''}</option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </HStack>
            </Box>
          )}

          <Box
            h={{ base: '400px', md: '520px' }}
            overflowY="auto" px={4} py={3}
            bg={isDark ? 'gray.850' : 'gray.25'}
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                borderRadius: '3px',
              },
            }}
          >
            <VStack gap={3} align="stretch">
              {messages.map((msg) => (
                <Box key={msg.id}>
                  <Flex justify={msg.role === 'user' ? 'flex-end' : 'flex-start'} align="start" gap={2}>
                    {msg.role === 'assistant' && (
                      <Flex w={7} h={7} borderRadius="full"
                        bg={msg.severity === 'error' ? (isDark ? 'red.800' : 'red.100')
                          : msg.severity === 'warning' ? (isDark ? 'orange.800' : 'orange.100')
                          : (isDark ? 'purple.800' : 'purple.100')}
                        align="center" justify="center" flexShrink={0} mt={1}>
                        <Icon
                          as={msg.severity === 'error' || msg.severity === 'warning' ? FiAlertTriangle : LuSparkles}
                          boxSize={3.5}
                          color={msg.severity === 'error' ? 'red.500' : msg.severity === 'warning' ? 'orange.500' : 'purple.500'}
                        />
                      </Flex>
                    )}
                    <Box
                      maxW={msg.aiResponse ? '100%' : '85%'}
                      p={3} borderRadius="xl"
                      bg={msg.role === 'user' ? userBubbleBg
                        : msg.severity === 'warning' ? warningBubbleBg
                        : msg.severity === 'error' ? (isDark ? 'red.900' : 'red.50')
                        : botBubbleBg}
                      borderWidth="1px"
                      borderColor={
                        msg.role === 'user' ? (isDark ? 'blue.700' : 'blue.200')
                        : msg.severity === 'error' ? (isDark ? 'red.700' : 'red.200')
                        : msg.severity === 'warning' ? (isDark ? 'orange.700' : 'orange.200')
                        : (isDark ? 'gray.600' : 'gray.200')
                      }
                    >
                      <Text fontSize="sm" color={colors.textColor} whiteSpace="pre-wrap" lineHeight="1.7">
                        {msg.content}
                      </Text>
                    </Box>
                    {msg.role === 'user' && (
                      <Flex w={7} h={7} borderRadius="full" bg={isDark ? 'blue.800' : 'blue.100'}
                        align="center" justify="center" flexShrink={0} mt={1}>
                        <Icon as={FiUser} boxSize={3.5} color={isDark ? 'blue.300' : 'blue.600'} />
                      </Flex>
                    )}
                  </Flex>

                  {msg.aiResponse && (
                    <Box mt={3} ml={9}>
                      <CPAIResponseDisplay
                        response={msg.aiResponse}
                        headerTitle={`Propuesta PAA ${fiscalYear}`}
                        headerSubtitle={`${wizardData.entityName} - Formato SERCOP`}
                      />
                      <HStack mt={3} gap={2} flexWrap="wrap">
                        {onCreatePAA && (
                          <Button size="sm" colorPalette="green"
                            onClick={() => onCreatePAA({ entityName: wizardData.entityName, entityRuc: wizardData.entityRuc })}>
                            <Icon as={FiPlus} mr={1} /> Crear PAA con estos datos
                          </Button>
                        )}
                        {onSubmitDepartmentPlan && isWorkspaceMode && (
                          <Button size="sm" colorPalette="blue"
                            onClick={() => onSubmitDepartmentPlan(proposalResponse)}>
                            <Icon as={FiSend} mr={1} /> Enviar plan del departamento
                          </Button>
                        )}
                        <Button size="sm" colorPalette="purple" variant="outline"
                          onClick={() => handleOptionClick('__restart__')}>
                          <Icon as={FiRotateCcw} mr={1} /> Generar otro PAA
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  {msg.options && msg.options.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                    <Flex mt={2} ml={9} gap={2} flexWrap="wrap">
                      {msg.options.map((opt) => (
                        <Button key={opt.value} size="xs" variant="outline"
                          colorPalette={opt.color || 'purple'} borderRadius="full"
                          onClick={() => handleOptionClick(opt.value)} disabled={isTyping}
                          _hover={{ bg: isDark ? `${opt.color || 'purple'}.900` : `${opt.color || 'purple'}.50`, transform: 'translateY(-1px)' }}
                          transition="all 0.2s">
                          {opt.label}
                        </Button>
                      ))}
                    </Flex>
                  )}
                </Box>
              ))}

              {isTyping && (
                <Flex align="start" gap={2}>
                  <Flex w={7} h={7} borderRadius="full" bg={isDark ? 'purple.800' : 'purple.100'}
                    align="center" justify="center" flexShrink={0}>
                    <Icon as={LuSparkles} boxSize={3.5} color="purple.500" />
                  </Flex>
                  <Box p={3} borderRadius="xl" bg={botBubbleBg} borderWidth="1px"
                    borderColor={isDark ? 'gray.600' : 'gray.200'}>
                    <HStack gap={2}>
                      <Spinner size="xs" color="purple.500" />
                      <Text fontSize="sm" color={colors.textColorSecondary}>
                        {currentStep === 'GENERATING' ? 'Generando PAA final en formato SERCOP...'
                          : currentStep === 'ENTITY_VALIDATING' ? 'Verificando entidad en registros publicos...'
                          : currentStep === 'DEPARTMENTS_SUGGESTING' ? 'Consultando estructura organizacional de la entidad...'
                          : currentStep === 'NEEDS_ENRICHING' ? 'Analizando necesidades, asignando CPC, estimando costos...'
                          : 'Procesando...'}
                      </Text>
                    </HStack>
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          {/* Input */}
          {showInput && (
            <Box px={4} py={3} borderTopWidth="1px" borderColor={cardBorder} bg={isDark ? 'gray.800' : 'white'}>
              {currentStep === 'DEPARTMENTS' && wizardData.departments.length > 0 && (
                <Flex gap={1} mb={2} flexWrap="wrap">
                  {wizardData.departments.map((dept, i) => (
                    <Badge key={i} colorPalette="purple" variant="subtle" size="sm" borderRadius="full" px={2}>
                      {dept}
                    </Badge>
                  ))}
                </Flex>
              )}
              <HStack gap={2}>
                {showTextarea ? (
                  <Textarea
                    ref={inputRef as any}
                    value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()} size="sm" rows={4} resize="none"
                    bg={isDark ? 'gray.750' : 'white'} borderColor={isDark ? 'gray.600' : 'gray.300'}
                    color={colors.textColor} borderRadius="lg"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={isTyping}
                  />
                ) : (
                  <Input
                    ref={inputRef}
                    value={currentStep === 'DEPARTMENTS' ? deptInput : inputValue}
                    onChange={(e) => currentStep === 'DEPARTMENTS' ? setDeptInput(e.target.value) : setInputValue(e.target.value)}
                    placeholder={getPlaceholder()} size="sm"
                    bg={isDark ? 'gray.750' : 'white'} borderColor={isDark ? 'gray.600' : 'gray.300'}
                    color={colors.textColor} borderRadius="lg"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                    onKeyDown={handleKeyDown} disabled={isTyping}
                  />
                )}
                {currentStep === 'DEPARTMENTS' && wizardData.departments.length > 0 && (
                  <Button size="sm" colorPalette="green" variant="solid"
                    onClick={() => processInput('listo')} disabled={isTyping} borderRadius="lg">
                    <Icon as={FiCheck} mr={1} /> Listo
                  </Button>
                )}
                <IconButton aria-label="Enviar" colorPalette="purple" onClick={handleSend}
                  disabled={isTyping || (currentStep === 'DEPARTMENTS' ? !deptInput.trim() : !inputValue.trim())}
                  borderRadius="lg" size="sm">
                  <Icon as={FiSend} />
                </IconButton>
              </HStack>
              <Text fontSize="2xs" color={colors.textColorSecondary} mt={1}>
                {currentStep === 'NEEDS_CLARIFYING'
                  ? 'Responde las preguntas para que pueda generar items concretos'
                  : currentStep === 'NEEDS_REFINING'
                  ? 'Describe los cambios que quieres en la propuesta'
                  : showTextarea
                    ? 'Enter para enviar \u00B7 Shift+Enter nueva linea'
                    : 'Enter para enviar'}
              </Text>
            </Box>
          )}

          {currentStep === 'PROPOSAL' && (
            <Box px={4} py={3} borderTopWidth="1px" borderColor={cardBorder} bg={isDark ? 'gray.800' : 'white'}>
              <Flex justify="space-between" align="center">
                <Badge colorPalette="green" variant="subtle" fontSize="xs">
                  <Icon as={FiCheck} mr={1} /> PAA generado en formato SERCOP
                </Badge>
                <Text fontSize="2xs" color={colors.textColorSecondary}>
                  {proposalResponse?.provider} / {proposalResponse?.model} \u00B7 {proposalResponse?.processingTimeMs}ms
                </Text>
              </Flex>
            </Box>
          )}
        </Box>

        {/* RIGHT: Methodology Dashboard */}
        {selectedMethodology && (
          <Box
            w={{ base: '100%', lg: '340px' }}
            flexShrink={0}
            borderLeftWidth={{ base: 0, lg: '1px' }}
            borderTopWidth={{ base: '1px', lg: 0 }}
            borderColor={cardBorder}
            bg={isDark ? 'gray.800' : 'white'}
            display={{ base: currentStep !== 'WELCOME' ? 'block' : 'none', lg: 'block' }}
          >
            <CPPAAMethodologyDashboard
              phases={selectedMethodology.phases}
              phaseResults={phaseResults}
              currentPhaseCode={currentPhaseCode}
              methodologyName={selectedMethodology.name}
              entityName={wizardData.entityName || undefined}
              totalBudget={wizardData.totalBudget || undefined}
            />
          </Box>
        )}
      </Flex>
      </>)}
    </Box>
  );
};

export default CPPAAWizardChat;
