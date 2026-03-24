/**
 * ActionEditor Component
 * Visual editor for event rule actions - replaces raw JSON editing
 * Includes variable picker for easy template variable insertion
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Badge,
  Input,
  Textarea,
  Flex,
} from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiMail,
  FiSend,
  FiGlobe,
  FiFileText,
  FiCode,
  FiChevronRight,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import {
  VariablePicker,
  useTemplateVariables,
  type VariableCategory,
} from '../VariablePicker';

// Types
interface ActionConfig {
  tipo: string;
  orden: number;
  async: boolean;
  continueOnError: boolean;
  config: Record<string, any>;
}

interface ActionEditorProps {
  value: string; // JSON string
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ACTION_TYPES = [
  {
    value: 'SWIFT_MESSAGE',
    label: 'Mensaje SWIFT',
    icon: FiSend,
    color: 'blue',
    description: 'Genera y envía mensaje SWIFT'
  },
  {
    value: 'API_CALL',
    label: 'Llamar API Externa',
    icon: FiGlobe,
    color: 'purple',
    description: 'Ejecuta llamada a API externa configurada'
  },
  {
    value: 'EMAIL',
    label: 'Enviar Email',
    icon: FiMail,
    color: 'green',
    description: 'Envía notificación por correo'
  },
  {
    value: 'AUDITORIA',
    label: 'Registro Auditoría',
    icon: FiFileText,
    color: 'gray',
    description: 'Registra evento en log de auditoría'
  },
];

// Default configs for each action type
const getDefaultConfig = (tipo: string): Record<string, any> => {
  switch (tipo) {
    case 'SWIFT_MESSAGE':
      return {
        messageType: 'MT760',
        direction: 'OUTBOUND',
        description: 'Generar mensaje SWIFT',
      };
    case 'API_CALL':
      return {
        apiConfigCode: '',
        description: 'Llamar API externa',
        requestBody: {},
      };
    case 'EMAIL':
      return {
        provider: 'MAILGUN',
        template: '',
        subject: '',
        recipients: [],
        variables: {},
        description: 'Enviar notificación email',
      };
    case 'AUDITORIA':
      return {
        categoria: '',
        severidad: 'INFO',
        mensaje: '',
      };
    default:
      return {};
  }
};

// Highlighted Text Component - renders text with colored template variables
const HighlightedText: React.FC<{
  text: string;
  fontSize?: string;
  fontFamily?: string;
  availableVariables: VariableCategory[];
}> = ({ text, fontSize = 'xs', fontFamily = 'monospace', availableVariables }) => {
  const { getColors } = useTheme();
  const colors = getColors();

  // Parse text and highlight variables matching #{variableName}
  const renderHighlightedText = (input: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /#\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = regex.exec(input)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${keyIndex++}`}>
            {input.slice(lastIndex, match.index)}
          </span>
        );
      }

      // Get variable category color
      const varName = match[1];
      const category = availableVariables.find(cat =>
        cat.variables.some(v => v.name === varName)
      );
      const colorScheme = category?.color || 'purple';

      // Add highlighted variable
      parts.push(
        <span
          key={`var-${keyIndex++}`}
          style={{
            color: `var(--chakra-colors-${colorScheme}-500)`,
            backgroundColor: `var(--chakra-colors-${colorScheme}-100)`,
            borderRadius: '3px',
            padding: '0 2px',
            fontWeight: 600,
          }}
          title={category?.variables.find(v => v.name === varName)?.description || varName}
        >
          {match[0]}
        </span>
      );
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      parts.push(
        <span key={`text-${keyIndex++}`}>
          {input.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : input;
  };

  return (
    <Box
      as="pre"
      fontSize={fontSize}
      fontFamily={fontFamily}
      whiteSpace="pre-wrap"
      wordBreak="break-all"
      color={colors.textColor}
      m={0}
    >
      {renderHighlightedText(text)}
    </Box>
  );
};

// Highlighted Textarea Component - textarea with syntax highlighting overlay
const HighlightedTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minH?: string;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
  availableVariables: VariableCategory[];
}> = ({ value, onChange, placeholder, disabled, minH = '180px', textareaRef, availableVariables }) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <Box position="relative" ref={containerRef}>
      {/* Highlighted background layer */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        p="8px 12px"
        overflow="hidden"
        pointerEvents="none"
        borderRadius="md"
        bg={colors.bgColor}
        border="1px solid"
        borderColor={colors.borderColor}
      >
        <Box
          position="relative"
          style={{ transform: `translateY(-${scrollTop}px)` }}
        >
          <HighlightedText text={value || ''} fontSize="xs" fontFamily="monospace" availableVariables={availableVariables} />
        </Box>
      </Box>

      {/* Transparent textarea for editing */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        disabled={disabled}
        minH={minH}
        fontFamily="monospace"
        fontSize="xs"
        spellCheck={false}
        bg="transparent"
        color="transparent"
        caretColor={colors.textColor}
        position="relative"
        zIndex={1}
        _placeholder={{ color: colors.textColorSecondary }}
        css={{
          '&::selection': {
            backgroundColor: 'rgba(66, 153, 225, 0.3)',
          },
        }}
      />
    </Box>
  );
};

// VariablePicker is now imported from ../VariablePicker

export const ActionEditor: React.FC<ActionEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Use shared hook for template variables
  const { variables: availableVariables, categoryLabels } = useTemplateVariables();

  // Refs for textarea elements to insert variables at cursor
  const textareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({});

  // Parse JSON on mount and when value changes externally
  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setActions(parsed);
        }
      }
    } catch (e) {
      // Invalid JSON, keep current state
    }
  }, []);

  // Update parent when actions change
  const updateParent = (newActions: ActionConfig[]) => {
    setActions(newActions);
    onChange(JSON.stringify(newActions, null, 2));
  };

  // Add new action
  const handleAddAction = (tipo: string) => {
    const newAction: ActionConfig = {
      tipo,
      orden: actions.length + 1,
      async: tipo !== 'SWIFT_MESSAGE',
      continueOnError: tipo === 'AUDITORIA',
      config: getDefaultConfig(tipo),
    };
    const newActions = [...actions, newAction];
    updateParent(newActions);
    setExpandedIndex(newActions.length - 1);
  };

  // Remove action
  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    newActions.forEach((a, i) => (a.orden = i + 1));
    updateParent(newActions);
    setExpandedIndex(null);
  };

  // Move action up/down
  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === actions.length - 1) return;

    const newActions = [...actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
    newActions.forEach((a, i) => (a.orden = i + 1));
    updateParent(newActions);
    setExpandedIndex(targetIndex);
  };

  // Update action config
  const handleUpdateConfig = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index].config[field] = value;
    updateParent(newActions);
  };

  // Update action property
  const handleUpdateAction = (index: number, field: keyof ActionConfig, value: any) => {
    const newActions = [...actions];
    (newActions[index] as any)[field] = value;
    updateParent(newActions);
  };

  // Insert variable at cursor position in textarea
  const handleInsertVariable = (index: number, varName: string) => {
    const textarea = textareaRefs.current[index];
    if (!textarea) return;

    const variable = `#{${varName}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);

    // Update the config
    try {
      const parsed = JSON.parse(newValue);
      handleUpdateConfig(index, 'requestBody', parsed);
    } catch {
      // If not valid JSON, just update as string
      handleUpdateConfig(index, 'requestBody', newValue);
    }

    // Refocus and set cursor position after the inserted variable
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = start + variable.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Get action type info
  const getActionTypeInfo = (tipo: string) => {
    return ACTION_TYPES.find((t) => t.value === tipo) || ACTION_TYPES[0];
  };

  // Format JSON for display
  const formatJson = (obj: any): string => {
    try {
      if (typeof obj === 'string') {
        const parsed = JSON.parse(obj);
        return JSON.stringify(parsed, null, 2);
      }
      return JSON.stringify(obj, null, 2);
    } catch {
      return typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
    }
  };

  // Render config fields based on action type
  const renderConfigFields = (action: ActionConfig, index: number) => {
    switch (action.tipo) {
      case 'SWIFT_MESSAGE':
        return (
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Tipo de Mensaje</Text>
              <select
                value={action.config.messageType || ''}
                onChange={(e) => handleUpdateConfig(index, 'messageType', e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="MT700">MT700 - LC Emisión</option>
                <option value="MT707">MT707 - LC Enmienda</option>
                <option value="MT730">MT730 - Aceptación</option>
                <option value="MT756">MT756 - Pago</option>
                <option value="MT760">MT760 - Garantía Emisión</option>
                <option value="MT767">MT767 - Garantía Enmienda</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Dirección</Text>
              <select
                value={action.config.direction || 'OUTBOUND'}
                onChange={(e) => handleUpdateConfig(index, 'direction', e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="OUTBOUND">Salida (OUTBOUND)</option>
                <option value="INBOUND">Entrada (INBOUND)</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Descripción</Text>
              <Input
                size="sm"
                value={action.config.description || ''}
                onChange={(e) => handleUpdateConfig(index, 'description', e.target.value)}
                disabled={disabled}
                placeholder="Descripción de la acción"
              />
            </Box>
          </VStack>
        );

      case 'API_CALL':
        return (
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Código API Externa *</Text>
              <Input
                size="sm"
                value={action.config.apiConfigCode || ''}
                onChange={(e) => handleUpdateConfig(index, 'apiConfigCode', e.target.value)}
                disabled={disabled}
                placeholder="Ej: MAILGUN_EMAIL, SENDGRID_EMAIL"
              />
              <Text fontSize="xs" color={textColorSecondary} mt={1}>
                Código de la API configurada en /admin/external-api-config
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Descripción</Text>
              <Input
                size="sm"
                value={action.config.description || ''}
                onChange={(e) => handleUpdateConfig(index, 'description', e.target.value)}
                disabled={disabled}
                placeholder="Descripción de la llamada API"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Cuerpo de la Petición (JSON)</Text>

              {/* Variable Picker */}
              <VariablePicker
                onSelect={(varName) => handleInsertVariable(index, varName)}
                disabled={disabled}
                availableVariables={availableVariables}
                categoryLabels={categoryLabels}
                variableSyntax="hash"
              />

              <HighlightedTextarea
                textareaRef={(el) => { textareaRefs.current[index] = el; }}
                value={formatJson(action.config.requestBody)}
                onChange={(newValue) => {
                  try {
                    const parsed = JSON.parse(newValue);
                    handleUpdateConfig(index, 'requestBody', parsed);
                  } catch {
                    handleUpdateConfig(index, 'requestBody', newValue);
                  }
                }}
                disabled={disabled}
                placeholder={`{
  "from": "noreply@globalcmx.com",
  "to": "#{applicantEmail}",
  "subject": "Operación Aprobada - #{reference}",
  "html": "<h2>Operación Aprobada</h2><p>Estimado #{applicantName},</p><p>Su operación ha sido procesada exitosamente.</p><ul><li>Referencia: #{reference}</li><li>Monto: #{currency} #{amount}</li><li>Beneficiario: #{beneficiaryName}</li><li>Vencimiento: #{expiryDate}</li></ul><p>Saludos,<br/>GlobalCMX</p>"
}`}
                minH="180px"
                availableVariables={availableVariables}
              />
            </Box>
          </VStack>
        );

      case 'EMAIL':
        return (
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Proveedor</Text>
              <select
                value={action.config.provider || 'MAILGUN'}
                onChange={(e) => handleUpdateConfig(index, 'provider', e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="MAILGUN">Mailgun</option>
                <option value="SENDGRID">SendGrid</option>
                <option value="SMTP">SMTP</option>
                <option value="AWS_SES">AWS SES</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Plantilla</Text>
              <Input
                size="sm"
                value={action.config.template || ''}
                onChange={(e) => handleUpdateConfig(index, 'template', e.target.value)}
                disabled={disabled}
                placeholder="Código de plantilla de email"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Asunto</Text>
              <VariablePicker
                onSelect={(varName) => {
                  const current = action.config.subject || '';
                  handleUpdateConfig(index, 'subject', current + `#{${varName}}`);
                }}
                disabled={disabled}
                availableVariables={availableVariables}
                categoryLabels={categoryLabels}
                variableSyntax="hash"
              />
              <Input
                size="sm"
                value={action.config.subject || ''}
                onChange={(e) => handleUpdateConfig(index, 'subject', e.target.value)}
                disabled={disabled}
                placeholder="Asunto del email - #{reference}"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Destinatarios (separados por coma)</Text>
              <Input
                size="sm"
                value={Array.isArray(action.config.recipients)
                  ? action.config.recipients.join(', ')
                  : action.config.recipients || ''}
                onChange={(e) => handleUpdateConfig(index, 'recipients',
                  e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                )}
                disabled={disabled}
                placeholder="#{applicantEmail}, #{beneficiaryEmail}"
              />
            </Box>
          </VStack>
        );

      case 'AUDITORIA':
        return (
          <VStack align="stretch" gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Categoría</Text>
              <Input
                size="sm"
                value={action.config.categoria || ''}
                onChange={(e) => handleUpdateConfig(index, 'categoria', e.target.value)}
                disabled={disabled}
                placeholder="Ej: GARANTIA_EMITIDA, LC_APROBADA"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Severidad</Text>
              <select
                value={action.config.severidad || 'INFO'}
                onChange={(e) => handleUpdateConfig(index, 'severidad', e.target.value)}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Mensaje</Text>
              <Input
                size="sm"
                value={action.config.mensaje || ''}
                onChange={(e) => handleUpdateConfig(index, 'mensaje', e.target.value)}
                disabled={disabled}
                placeholder="Mensaje de auditoría"
              />
            </Box>
          </VStack>
        );

      default:
        return (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Configuración (JSON)</Text>
            <HighlightedTextarea
              value={JSON.stringify(action.config, null, 2)}
              onChange={(newValue) => {
                try {
                  const parsed = JSON.parse(newValue);
                  const newActions = [...actions];
                  newActions[index].config = parsed;
                  updateParent(newActions);
                } catch { /* ignore parse errors */ }
              }}
              disabled={disabled}
              minH="100px"
              availableVariables={availableVariables}
            />
          </Box>
        );
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Header with add buttons */}
      <Box>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="medium" color={textColor}>
            Acciones ({actions.length})
          </Text>
          <HStack gap={2}>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
            >
              <HStack gap={1}>
                <FiCode size={12} />
                <Text>{showJsonPreview ? 'Ocultar' : 'Ver'} JSON</Text>
              </HStack>
            </Button>
          </HStack>
        </Flex>

        {/* Add action buttons */}
        <Flex wrap="wrap" gap={2}>
          {ACTION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                size="sm"
                variant="outline"
                colorPalette={type.color}
                onClick={() => handleAddAction(type.value)}
                disabled={disabled}
              >
                <HStack gap={1}>
                  <Icon size={14} />
                  <Text fontSize="xs">{type.label}</Text>
                </HStack>
              </Button>
            );
          })}
        </Flex>
      </Box>

      {/* Actions list */}
      {actions.length === 0 ? (
        <Box
          p={6}
          textAlign="center"
          border="2px dashed"
          borderColor={borderColor}
          borderRadius="md"
        >
          <Text color={textColorSecondary}>
            No hay acciones configuradas. Haz clic en los botones de arriba para agregar.
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={2}>
          {actions.map((action, index) => {
            const typeInfo = getActionTypeInfo(action.tipo);
            const Icon = typeInfo.icon;
            const isExpanded = expandedIndex === index;

            return (
              <Box
                key={index}
                border="1px"
                borderColor={isExpanded ? primaryColor : borderColor}
                borderRadius="md"
                overflow="hidden"
                bg={cardBg}
              >
                {/* Action header */}
                <Flex
                  p={3}
                  align="center"
                  justify="space-between"
                  bg={isExpanded ? `${typeInfo.color}.50` : 'transparent'}
                  cursor="pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  _hover={{ bg: isExpanded ? `${typeInfo.color}.100` : colors.hoverBg }}
                >
                  <HStack gap={3}>
                    <Badge colorPalette={typeInfo.color} size="sm" px={2}>
                      {action.orden}
                    </Badge>
                    <Icon color={`var(--chakra-colors-${typeInfo.color}-500)`} />
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color={textColor}>
                        {typeInfo.label}
                      </Text>
                      <Text fontSize="xs" color={textColorSecondary}>
                        {action.config.description || typeInfo.description}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack gap={1}>
                    <Badge
                      colorPalette={action.async ? 'purple' : 'blue'}
                      size="sm"
                      variant="subtle"
                    >
                      {action.async ? 'Async' : 'Sync'}
                    </Badge>
                    {action.continueOnError && (
                      <Badge colorPalette="orange" size="sm" variant="subtle">
                        Continuar si falla
                      </Badge>
                    )}
                    <IconButton
                      aria-label="Mover arriba"
                      size="xs"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleMoveAction(index, 'up'); }}
                      disabled={disabled || index === 0}
                    >
                      <FiChevronUp />
                    </IconButton>
                    <IconButton
                      aria-label="Mover abajo"
                      size="xs"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleMoveAction(index, 'down'); }}
                      disabled={disabled || index === actions.length - 1}
                    >
                      <FiChevronDown />
                    </IconButton>
                    <IconButton
                      aria-label="Eliminar"
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={(e) => { e.stopPropagation(); handleRemoveAction(index); }}
                      disabled={disabled}
                    >
                      <FiTrash2 />
                    </IconButton>
                    <FiChevronRight
                      style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </HStack>
                </Flex>

                {/* Action config (expanded) */}
                {isExpanded && (
                  <Box p={4} borderTop="1px" borderColor={borderColor}>
                    {/* Common options */}
                    <HStack gap={4} mb={4}>
                      <HStack gap={2}>
                        <input
                          type="checkbox"
                          checked={action.async}
                          onChange={(e) => handleUpdateAction(index, 'async', e.target.checked)}
                          disabled={disabled}
                        />
                        <Text fontSize="sm" color={textColor}>Asíncrono</Text>
                      </HStack>
                      <HStack gap={2}>
                        <input
                          type="checkbox"
                          checked={action.continueOnError}
                          onChange={(e) => handleUpdateAction(index, 'continueOnError', e.target.checked)}
                          disabled={disabled}
                        />
                        <Text fontSize="sm" color={textColor}>Continuar si falla</Text>
                      </HStack>
                    </HStack>

                    {/* Type-specific fields */}
                    {renderConfigFields(action, index)}
                  </Box>
                )}
              </Box>
            );
          })}
        </VStack>
      )}

      {/* JSON Preview */}
      {showJsonPreview && (
        <Box
          p={3}
          bg={bgColor}
          borderRadius="md"
          border="1px"
          borderColor={borderColor}
        >
          <Text fontSize="xs" fontWeight="medium" color={textColorSecondary} mb={2}>
            Vista previa JSON:
          </Text>
          <Box maxH="200px" overflowY="auto">
            <HighlightedText text={JSON.stringify(actions, null, 2)} fontSize="xs" fontFamily="monospace" availableVariables={availableVariables} />
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default ActionEditor;
