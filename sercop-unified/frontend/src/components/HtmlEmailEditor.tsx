/**
 * HtmlEmailEditor — Visual HTML editor with 3 tabs: Visual / Código / Preview
 * Includes contentEditable toolbar, code textarea, and sanitized preview.
 * Integrates VariablePicker for inserting template variables.
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Textarea,
  Flex,
  Input,
} from '@chakra-ui/react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiList,
  FiLink,
  FiHash,
  FiCode,
  FiEye,
  FiEdit3,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { sanitizeHtml } from '../utils/sanitize';
import { VariablePicker, type VariableCategory } from './VariablePicker';

// ── Props ───────────────────────────────────────────────────────────

export interface HtmlEmailEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variables?: VariableCategory[];
  categoryLabels?: Record<string, string>;
  placeholder?: string;
}

// ── Tab type ────────────────────────────────────────────────────────

type EditorTab = 'visual' | 'code' | 'preview';

// ── Component ───────────────────────────────────────────────────────

export const HtmlEmailEditor: React.FC<HtmlEmailEditorProps> = ({
  value,
  onChange,
  disabled = false,
  variables = [],
  categoryLabels = {},
  placeholder,
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const [activeTab, setActiveTab] = useState<EditorTab>('visual');
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync value → visual editor when switching to visual tab
  useEffect(() => {
    if (activeTab === 'visual' && editorRef.current) {
      // Only update if content differs (avoid caret jump)
      const sanitized = sanitizeHtml(value || '');
      if (editorRef.current.innerHTML !== sanitized) {
        editorRef.current.innerHTML = sanitized;
      }
    }
  }, [activeTab, value]);

  // ── Sync from contentEditable → parent ──────────────────────────

  const handleVisualInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // ── Toolbar actions ─────────────────────────────────────────────

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleVisualInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    execCommand('createLink', linkUrl.trim());
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleInsertVariable = (varName: string) => {
    const variable = `\${${varName}}`;

    if (activeTab === 'visual' && editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      document.execCommand('insertText', false, variable);
      handleVisualInput();
    } else if (activeTab === 'code') {
      // For code tab, insert at cursor via onChange
      onChange(value + variable);
    }

    setShowVariablePicker(false);
  };

  // ── Tab bar ─────────────────────────────────────────────────────

  const tabs: { key: EditorTab; label: string; icon: React.ReactNode }[] = [
    { key: 'visual', label: 'Visual', icon: <FiEdit3 size={14} /> },
    { key: 'code', label: 'Código', icon: <FiCode size={14} /> },
    { key: 'preview', label: 'Preview', icon: <FiEye size={14} /> },
  ];

  // ── Toolbar buttons ─────────────────────────────────────────────

  const toolbarButtons = [
    { icon: <FiBold size={14} />, label: 'Negrita', cmd: 'bold' },
    { icon: <FiItalic size={14} />, label: 'Itálica', cmd: 'italic' },
    { icon: <FiUnderline size={14} />, label: 'Subrayado', cmd: 'underline' },
    { type: 'separator' as const },
    { icon: <FiAlignLeft size={14} />, label: 'Alinear izq.', cmd: 'justifyLeft' },
    { icon: <FiAlignCenter size={14} />, label: 'Centrar', cmd: 'justifyCenter' },
    { icon: <FiAlignRight size={14} />, label: 'Alinear der.', cmd: 'justifyRight' },
    { type: 'separator' as const },
    { icon: <FiList size={14} />, label: 'Lista', cmd: 'insertUnorderedList' },
  ];

  return (
    <Box
      border="1px"
      borderColor={colors.borderColor}
      borderRadius="md"
      overflow="hidden"
    >
      {/* Tab bar */}
      <Flex bg={colors.bgColor} borderBottom="1px" borderColor={colors.borderColor}>
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant="ghost"
            borderRadius="0"
            borderBottom="2px solid"
            borderBottomColor={activeTab === tab.key ? colors.primaryColor : 'transparent'}
            color={activeTab === tab.key ? colors.primaryColor : colors.textColorSecondary}
            fontWeight={activeTab === tab.key ? 'bold' : 'normal'}
            onClick={() => setActiveTab(tab.key)}
            px={4}
            py={2}
            _hover={{ bg: colors.hoverBg }}
          >
            <HStack gap={1}>
              {tab.icon}
              <Text fontSize="xs">{tab.label}</Text>
            </HStack>
          </Button>
        ))}
      </Flex>

      {/* Toolbar — only for Visual tab */}
      {activeTab === 'visual' && !disabled && (
        <Flex
          p={1}
          bg={colors.bgColor}
          borderBottom="1px"
          borderColor={colors.borderColor}
          align="center"
          wrap="wrap"
          gap={0}
        >
          {toolbarButtons.map((btn, idx) => {
            if ('type' in btn && btn.type === 'separator') {
              return (
                <Box
                  key={`sep-${idx}`}
                  w="1px"
                  h="20px"
                  bg={colors.borderColor}
                  mx={1}
                />
              );
            }
            return (
              <IconButton
                key={btn.cmd}
                aria-label={btn.label!}
                size="xs"
                variant="ghost"
                onClick={() => execCommand(btn.cmd!)}
                title={btn.label}
                color={colors.textColor}
                _hover={{ bg: colors.hoverBg }}
              >
                {btn.icon}
              </IconButton>
            );
          })}

          {/* Separator */}
          <Box w="1px" h="20px" bg={colors.borderColor} mx={1} />

          {/* Link button */}
          <IconButton
            aria-label="Insertar enlace"
            size="xs"
            variant="ghost"
            onClick={() => {
              saveSelection();
              setShowLinkInput(!showLinkInput);
            }}
            title="Insertar enlace"
            color={showLinkInput ? colors.primaryColor : colors.textColor}
            _hover={{ bg: colors.hoverBg }}
          >
            <FiLink size={14} />
          </IconButton>

          {/* Variable picker toggle */}
          {variables.length > 0 && (
            <>
              <Box w="1px" h="20px" bg={colors.borderColor} mx={1} />
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  saveSelection();
                  setShowVariablePicker(!showVariablePicker);
                }}
                color={showVariablePicker ? colors.primaryColor : colors.textColor}
                _hover={{ bg: colors.hoverBg }}
              >
                <HStack gap={1}>
                  <FiHash size={12} />
                  <Text fontSize="xs">Variable</Text>
                </HStack>
              </Button>
            </>
          )}
        </Flex>
      )}

      {/* Link URL input */}
      {showLinkInput && activeTab === 'visual' && (
        <Flex p={2} bg={colors.bgColor} borderBottom="1px" borderColor={colors.borderColor} gap={2}>
          <Input
            size="xs"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
            flex={1}
          />
          <Button size="xs" colorPalette="blue" onClick={handleInsertLink}>
            Insertar
          </Button>
          <Button size="xs" variant="ghost" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}>
            Cancelar
          </Button>
        </Flex>
      )}

      {/* Variable picker dropdown */}
      {showVariablePicker && (activeTab === 'visual' || activeTab === 'code') && (
        <Box borderBottom="1px" borderColor={colors.borderColor}>
          <VariablePicker
            onSelect={handleInsertVariable}
            disabled={disabled}
            availableVariables={variables}
            categoryLabels={categoryLabels}
            variableSyntax="dollar"
          />
        </Box>
      )}

      {/* ── Visual tab ───────────────────────────────────────────── */}
      {activeTab === 'visual' && (
        <Box
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleVisualInput}
          onBlur={saveSelection}
          p={4}
          minH="300px"
          maxH="500px"
          overflowY="auto"
          bg={colors.cardBg}
          color={colors.textColor}
          fontSize="sm"
          outline="none"
          css={{
            '& a': { color: 'var(--chakra-colors-blue-500)', textDecoration: 'underline' },
            '& h1': { fontSize: '1.5em', fontWeight: 'bold', marginBottom: '0.5em' },
            '& h2': { fontSize: '1.25em', fontWeight: 'bold', marginBottom: '0.4em' },
            '& h3': { fontSize: '1.1em', fontWeight: 'bold', marginBottom: '0.3em' },
            '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
            '& p': { marginBottom: '0.5em' },
            '&:empty::before': {
              content: `"${placeholder || 'Escriba el contenido HTML del correo aquí...'}"`,
              color: 'var(--chakra-colors-gray-400)',
              pointerEvents: 'none',
            },
          }}
        />
      )}

      {/* ── Code tab ─────────────────────────────────────────────── */}
      {activeTab === 'code' && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          minH="300px"
          maxH="500px"
          fontFamily="monospace"
          fontSize="sm"
          border="none"
          borderRadius="0"
          bg={colors.cardBg}
          color={colors.textColor}
          resize="vertical"
          spellCheck={false}
          placeholder={placeholder || '<html>\n<body>\n  <h1>Estimado ${nombreCliente}</h1>\n  <p>Contenido del correo...</p>\n</body>\n</html>'}
        />
      )}

      {/* ── Preview tab ──────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <Box p={4} minH="300px" maxH="500px" overflowY="auto" bg="white">
          {value ? (
            <Box
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
              fontSize="sm"
              color="gray.800"
              css={{
                '& a': { color: 'var(--chakra-colors-blue-500)', textDecoration: 'underline' },
                '& h1': { fontSize: '1.5em', fontWeight: 'bold', marginBottom: '0.5em' },
                '& h2': { fontSize: '1.25em', fontWeight: 'bold', marginBottom: '0.4em' },
                '& h3': { fontSize: '1.1em', fontWeight: 'bold', marginBottom: '0.3em' },
                '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
                '& p': { marginBottom: '0.5em' },
              }}
            />
          ) : (
            <Flex justify="center" align="center" minH="200px">
              <Text color="gray.400" fontSize="sm">
                Sin contenido para previsualizar
              </Text>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
};

export default HtmlEmailEditor;
