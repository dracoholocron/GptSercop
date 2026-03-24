/**
 * WorkboxOperationsPage - Generic component for all workbox operation pages
 *
 * This transversal component eliminates code duplication across:
 * - WorkboxLCImports
 * - WorkboxLCExports
 * - WorkboxGuarantees
 * - WorkboxCollections
 *
 * Features the ExpiryDashboard for spectacular expiry date visualization
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Dialog,
  Tabs,
  VStack,
  Badge,
  HStack,
  IconButton,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { FiAlertCircle, FiGrid, FiList, FiAlertTriangle, FiInfo, FiCheckCircle, FiFileText, FiEdit3, FiFolder, FiDollarSign, FiMessageSquare, FiActivity, FiZap } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { OperationsTable } from './OperationsTable';
import { ExpiryDashboard } from './ExpiryDashboard';
import { EventGuidePanel } from './EventGuidePanel';
import { SwiftMessagesTable } from './SwiftMessagesTable';
import { OperationSummaryPanel } from './OperationSummaryPanel';
import { ChangeTrackingPanel } from './ChangeTrackingPanel';
import { OperationFlowViewer } from '../flow';
import { pendingApprovalQueries } from '../../services/pendingApprovalService';
import { operationsApi } from '../../services/operationsApi';
import { documentService } from '../../services/documentService';
import backofficeRequestService from '../../services/backofficeRequestService';
import type { DocumentInfo } from '../../services/backofficeRequestService';
import { DocumentUploader, DocumentList } from '../documents';
import { openDocumentWithAuth, downloadDocumentWithAuth } from '../../utils/documentUtils';
import { FiDownload, FiEye, FiPaperclip } from 'react-icons/fi';
import { OperationAccountingPanel } from './OperationAccountingPanel';
import { LockStatusBar } from '../locks/LockStatusBar';
import { useOperationLock } from '../../hooks/useOperationLock';
import type { Operation, OperationAlert, OperationAnalysisSummary } from '../../types/operations';
import type { DocumentCategory, DocumentType } from '../../types/documents';

type DialogTab = 'changes' | 'summary' | 'messages' | 'events' | 'execute' | 'alerts' | 'documents' | 'accounting';
type ViewMode = 'expiry' | 'table';

interface WorkboxOperationsPageProps {
  productType: string;
  titleKey: string;
  subtitleKey: string;
  /** Default view mode - 'expiry' for expiry dashboard, 'table' for classic table */
  defaultViewMode?: ViewMode;
}

export const WorkboxOperationsPage = ({
  productType,
  titleKey,
  subtitleKey,
  defaultViewMode = 'expiry',
}: WorkboxOperationsPageProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DialogTab>('summary');
  const [visitedTabs, setVisitedTabs] = useState<Set<DialogTab>>(new Set(['summary']));
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [pendingApprovalOperationIds, setPendingApprovalOperationIds] = useState<Set<string>>(new Set());
  const [operationSummary, setOperationSummary] = useState<OperationAnalysisSummary | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentsKey, setDocumentsKey] = useState(0); // For refreshing document list
  const [isTabLoading, setIsTabLoading] = useState(false); // Loading indicator for tab changes
  const [clientRequestDocuments, setClientRequestDocuments] = useState<DocumentInfo[]>([]); // Documents from linked client request
  const [loadingClientDocs, setLoadingClientDocs] = useState(false);

  // Lock management hook
  const {
    lock,
    remainingSeconds,
    isLoading: isLockLoading,
    acquireLock,
    releaseLock,
    extendLock,
    refresh: refreshLock,
  } = useOperationLock({
    operationId: selectedOperation?.operationId || '',
    operationReference: selectedOperation?.reference,
    productType: selectedOperation?.productType,
    autoRefresh: !!selectedOperation && isDialogOpen,
    refreshInterval: 10000,
    onLockExpiring: () => {
      // Notificar al usuario que el bloqueo está por expirar
      console.log('Lock expiring soon');
    },
    onLockExpired: () => {
      // El bloqueo expiró
      console.log('Lock expired');
    },
  });

  // Check if current user can operate (has the lock)
  const canOperate = !lock?.locked || lock?.lockedByCurrentUser || false;

  // Read query params for deep-linking from Quick Actions timeline
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkProcessed = useRef(false);

  useEffect(() => {
    loadPendingApprovalOperationIds();
    loadDocumentCategoriesAndTypes();
  }, []);

  // Auto-open dialog if ?operation=X&tab=Y is in URL (from Quick Actions)
  useEffect(() => {
    const operationId = searchParams.get('operation');
    const tab = searchParams.get('tab') as DialogTab | null;
    if (operationId && !deepLinkProcessed.current) {
      deepLinkProcessed.current = true;
      // Load the operation and open dialog
      (async () => {
        try {
          const results = await operationsApi.searchByReference(operationId);
          const op = results.find(r => r.operationId === operationId);
          if (op) {
            setIsTabLoading(true);
            setSelectedOperation(op);
            setActiveTab(tab || 'summary');
            setVisitedTabs(new Set([tab || 'summary']));
            setOperationSummary(null);
            setClientRequestDocuments([]);
            setIsDialogOpen(true);
          }
        } catch (error) {
          console.error('Error loading operation from deep link:', error);
        }
        // Clean URL params
        setSearchParams({}, { replace: true });
      })();
    }
  }, [searchParams]);

  const loadDocumentCategoriesAndTypes = async () => {
    try {
      const [cats, types] = await Promise.all([
        documentService.getCategories(),
        documentService.getDocumentTypes(),
      ]);
      setDocumentCategories(cats);
      setDocumentTypes(types);
    } catch (error) {
      console.error('Error loading document categories/types:', error);
    }
  };

  // Load operation summary when summary or alerts tab is selected
  // Only reload if operation changed (not when switching between summary/alerts)
  useEffect(() => {
    if ((activeTab === 'alerts' || activeTab === 'summary') && selectedOperation) {
      // Only load if we don't have the summary yet for this operation
      if (!operationSummary || operationSummary.operationId !== selectedOperation.operationId) {
        loadOperationSummary(selectedOperation.operationId);
      } else {
        // Summary already loaded, hide loading indicator
        setIsTabLoading(false);
      }
    } else if (selectedOperation && isTabLoading) {
      // For other tabs (messages, events, changes, documents, execute)
      // Hide loading after a short delay to allow content to render
      const timeout = setTimeout(() => {
        setIsTabLoading(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [activeTab, selectedOperation?.operationId]);

  // Load client request documents when documents tab is visited
  useEffect(() => {
    if (activeTab === 'documents' && selectedOperation && visitedTabs.has('documents')) {
      loadClientRequestDocuments(selectedOperation.reference);
    }
  }, [activeTab, selectedOperation?.reference, visitedTabs]);

  const loadClientRequestDocuments = async (operationReference: string) => {
    setLoadingClientDocs(true);
    setClientRequestDocuments([]);
    try {
      const docs = await backofficeRequestService.getDocumentsByOperationReference(operationReference);
      setClientRequestDocuments(docs);
    } catch (error) {
      console.error('Error loading client request documents:', error);
    } finally {
      setLoadingClientDocs(false);
    }
  };

  const loadOperationSummary = async (operationId: string) => {
    setLoadingAlerts(true);
    try {
      const summary = await operationsApi.getOperationSummary(operationId);
      setOperationSummary(summary);
    } catch (error) {
      console.error('Error loading operation summary:', error);
    } finally {
      setLoadingAlerts(false);
      setIsTabLoading(false); // Hide loading indicator
    }
  };

  const loadPendingApprovalOperationIds = async () => {
    try {
      const ids = await pendingApprovalQueries.getPendingOperationIds();
      setPendingApprovalOperationIds(new Set(ids));
    } catch (error) {
      console.error('Error loading pending approval operation IDs:', error);
    }
  };

  const hasPendingApproval = selectedOperation
    ? pendingApprovalOperationIds.has(selectedOperation.operationId)
    : false;

  // Operaciones cerradas son de solo lectura
  const isClosed = selectedOperation?.status === 'CLOSED';
  const isReadOnly = isClosed || hasPendingApproval;

  const handleViewDetails = (operation: Operation) => {
    setIsTabLoading(true); // Show loading immediately
    setSelectedOperation(operation);
    setActiveTab('summary');
    setVisitedTabs(new Set(['summary']));
    setOperationSummary(null); // Clear previous summary
    setClientRequestDocuments([]); // Clear previous client request documents
    setIsDialogOpen(true);
    // Loading will be hidden when loadingAlerts becomes false
  };

  const handleViewMessages = (operation: Operation) => {
    setIsTabLoading(true);
    setSelectedOperation(operation);
    setActiveTab('messages');
    setVisitedTabs(new Set(['messages']));
    setOperationSummary(null);
    setClientRequestDocuments([]);
    setIsDialogOpen(true);
  };

  const handleViewEvents = (operation: Operation) => {
    setIsTabLoading(true);
    setSelectedOperation(operation);
    setActiveTab('events');
    setVisitedTabs(new Set(['events']));
    setOperationSummary(null);
    setClientRequestDocuments([]);
    setIsDialogOpen(true);
  };

  const handleExecuteEvent = (operation: Operation) => {
    setIsTabLoading(true);
    setSelectedOperation(operation);
    setActiveTab('execute');
    setVisitedTabs(new Set(['execute']));
    setOperationSummary(null);
    setClientRequestDocuments([]);
    setIsDialogOpen(true);
  };

  const handleTabChange = (tab: DialogTab) => {
    // Only show loading if this is a new tab that hasn't been visited
    if (!visitedTabs.has(tab)) {
      setIsTabLoading(true);
    }
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  };

  const handleEventExecuted = (updatedOperation: Operation) => {
    setSelectedOperation(updatedOperation);
  };

  const handleResponseMarked = (updatedOperation: Operation) => {
    setSelectedOperation(updatedOperation);
    // Reload summary to refresh the data
    loadOperationSummary(updatedOperation.operationId);
  };

  return (
    <Box p={{ base: 3, md: 6, lg: 8 }}>
      <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
        <Box>
          <Heading size="lg" color={colors.textColor}>
            {t(titleKey)}
          </Heading>
          <Text color={colors.textColor} opacity={0.7}>
            {t(subtitleKey)}
          </Text>
        </Box>
        <HStack gap={2}>
          <IconButton
            aria-label={t('operations.expiry.viewTimeline')}
            variant={viewMode === 'expiry' ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => setViewMode('expiry')}
            title={t('operations.expiry.viewTimeline')}
          >
            <FiGrid />
          </IconButton>
          <IconButton
            aria-label={t('operations.expiry.viewTable')}
            variant={viewMode === 'table' ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => setViewMode('table')}
            title={t('operations.expiry.viewTable')}
          >
            <FiList />
          </IconButton>
        </HStack>
      </HStack>

      {viewMode === 'expiry' ? (
        <ExpiryDashboard
          productType={productType}
          onViewDetails={handleViewDetails}
          onViewMessages={handleViewMessages}
          onViewEvents={handleViewEvents}
          onExecuteEvent={handleExecuteEvent}
        />
      ) : (
        <Box
          bg={colors.cardBg}
          borderRadius="md"
          p={6}
          borderWidth="1px"
          borderColor={colors.borderColor}
        >
          <OperationsTable
            productType={productType}
            onViewDetails={handleViewDetails}
            onViewMessages={handleViewMessages}
            onViewEvents={handleViewEvents}
            onExecuteEvent={handleExecuteEvent}
          />
        </Box>
      )}

      <Dialog.Root open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)} size="xl">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg={colors.cardBg}
            maxW={{ base: '95vw', md: '90vw', lg: '1000px' }}
            h={{ base: '85vh', md: '80vh' }}
            mx={{ base: 2, md: 'auto' }}
            my={{ base: 2, md: 'auto' }}
            position="relative"
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }} pr={12}>
              {selectedOperation?.reference} - {t(`operations.stages.${selectedOperation?.stage}`)}
            </Dialog.Header>
            {/* Custom close button for better mobile accessibility */}
            <IconButton
              aria-label="Cerrar"
              position="absolute"
              top={{ base: 2, md: 3 }}
              right={{ base: 2, md: 3 }}
              size={{ base: 'md', md: 'sm' }}
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              zIndex={10}
            >
              <FiX size={20} />
            </IconButton>

            {/* Lock Status Bar - Control de concurrencia */}
            {selectedOperation && selectedOperation.status !== 'CLOSED' && (
              <Box px={{ base: 2, md: 4 }} pt={2}>
                <LockStatusBar
                  lock={lock}
                  remainingSeconds={remainingSeconds}
                  isLoading={isLockLoading}
                  onAcquireLock={(duration) => acquireLock(duration).catch(() => {
                    // Error already handled by hook - just prevent unhandled rejection
                  })}
                  onReleaseLock={() => releaseLock().catch(() => {
                    // Error already handled by hook
                  })}
                  onExtendLock={(seconds) => extendLock(seconds).catch(() => {
                    // Error already handled by hook
                  })}
                  operationReference={selectedOperation.reference}
                  productType={selectedOperation.productType}
                />
              </Box>
            )}

            <Dialog.Body p={{ base: 2, md: 4 }} flex="1" overflow="auto">
              {/* Loading indicator while content loads */}
              {(isTabLoading || loadingAlerts) && (
                <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="rgba(255,255,255,0.85)" zIndex={100} display="flex" alignItems="center" justifyContent="center" borderRadius="md">
                  <VStack>
                    <Spinner size="xl" color="blue.500" />
                    <Text color="gray.600" fontSize="sm">{t('common.loading', 'Cargando...')}</Text>
                  </VStack>
                </Box>
              )}
              <Tabs.Root value={activeTab} onValueChange={(e) => handleTabChange(e.value as DialogTab)} colorPalette="blue">
                {/* Modern Tab Navigation with Icons */}
                <Box
                  overflowX="auto"
                  overflowY="hidden"
                  css={{
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                  }}
                  pb={2}
                >
                  <HStack
                    gap={1}
                    p={1}
                    bg={isDark ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="xl"
                    w="fit-content"
                    minW="100%"
                  >
                    {/* Summary Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('summary')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'summary' ? 'blue.500' : 'transparent'}
                      color={activeTab === 'summary' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'summary' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'summary' ? 'blue.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiFileText size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.summary')}</Text>
                    </Box>

                    {/* Changes Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('changes')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'changes' ? 'purple.500' : 'transparent'}
                      color={activeTab === 'changes' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'changes' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'changes' ? 'purple.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiEdit3 size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.changes')}</Text>
                    </Box>

                    {/* Messages Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('messages')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'messages' ? 'cyan.500' : 'transparent'}
                      color={activeTab === 'messages' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'messages' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'messages' ? 'cyan.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiMessageSquare size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.swift')}</Text>
                    </Box>

                    {/* Events Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('events')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'events' ? 'teal.500' : 'transparent'}
                      color={activeTab === 'events' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'events' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'events' ? 'teal.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiActivity size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.events')}</Text>
                    </Box>

                    {/* Accounting Tab - NEW */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('accounting')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'accounting' ? 'green.500' : 'transparent'}
                      color={activeTab === 'accounting' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'accounting' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'accounting' ? 'green.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiDollarSign size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.accounting')}</Text>
                    </Box>

                    {/* Alerts Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('alerts')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'alerts' ? 'orange.500' : 'transparent'}
                      color={activeTab === 'alerts' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'alerts' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'alerts' ? 'orange.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                      position="relative"
                    >
                      <FiAlertTriangle size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.alerts')}</Text>
                      {selectedOperation?.hasAlerts && selectedOperation.alertCount && selectedOperation.alertCount > 0 && (
                        <Badge
                          colorPalette="red"
                          size="sm"
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          borderRadius="full"
                          minW="18px"
                          h="18px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xs"
                        >
                          {selectedOperation.alertCount}
                        </Badge>
                      )}
                    </Box>

                    {/* Documents Tab */}
                    <Box
                      as="button"
                      onClick={() => handleTabChange('documents')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'documents' ? 'pink.500' : 'transparent'}
                      color={activeTab === 'documents' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'documents' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      _hover={{ bg: activeTab === 'documents' ? 'pink.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100') }}
                      whiteSpace="nowrap"
                    >
                      <FiFolder size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.documents')}</Text>
                    </Box>

                    {/* Execute Tab */}
                    <Box
                      as="button"
                      onClick={() => !isReadOnly && handleTabChange('execute')}
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      bg={activeTab === 'execute' ? 'red.500' : 'transparent'}
                      color={activeTab === 'execute' ? 'white' : colors.textColor}
                      fontWeight={activeTab === 'execute' ? 'semibold' : 'normal'}
                      fontSize="sm"
                      transition="all 0.2s"
                      opacity={isReadOnly ? 0.5 : 1}
                      cursor={isReadOnly ? 'not-allowed' : 'pointer'}
                      _hover={{ bg: isReadOnly ? 'transparent' : (activeTab === 'execute' ? 'red.600' : (isDark ? 'whiteAlpha.200' : 'blackAlpha.100')) }}
                      whiteSpace="nowrap"
                      position="relative"
                      title={isClosed ? t('operations.closedReadOnly') : (hasPendingApproval ? t('operations.pendingApproval') : '')}
                    >
                      <FiZap size={16} />
                      <Text display={{ base: 'none', md: 'inline' }}>{t('operations.tabs.execute')}</Text>
                      {isClosed && (
                        <Badge
                          colorPalette="gray"
                          size="sm"
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          borderRadius="full"
                        >
                          <FiCheckCircle size={10} />
                        </Badge>
                      )}
                      {hasPendingApproval && !isClosed && (
                        <Badge
                          colorPalette="yellow"
                          size="sm"
                          position="absolute"
                          top="-4px"
                          right="-4px"
                          borderRadius="full"
                        >
                          <FiAlertCircle size={10} />
                        </Badge>
                      )}
                    </Box>
                  </HStack>
                </Box>

                {/* Hidden Tabs.List for accessibility */}
                <Tabs.List display="none">
                  <Tabs.Trigger value="summary" />
                  <Tabs.Trigger value="changes" />
                  <Tabs.Trigger value="messages" />
                  <Tabs.Trigger value="events" />
                  <Tabs.Trigger value="accounting" />
                  <Tabs.Trigger value="alerts" />
                  <Tabs.Trigger value="documents" />
                  <Tabs.Trigger value="execute" />
                </Tabs.List>
                <Tabs.Content value="summary">
                  {/* Resumen Visual: Panel con diseño atractivo de toda la información */}
                  {selectedOperation && (
                    <Box pt={4}>
                      <OperationSummaryPanel
                        operation={selectedOperation}
                        summary={operationSummary}
                        loading={loadingAlerts}
                        onResponseMarked={handleResponseMarked}
                      />
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="changes">
                  {/* Control de Cambios: Grid de campos SWIFT con historial de modificaciones */}
                  {visitedTabs.has('changes') && selectedOperation && (
                    <Box pt={4}>
                      <ChangeTrackingPanel operation={selectedOperation} />
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="messages">
                  {visitedTabs.has('messages') && selectedOperation && (
                    <Box pt={4}>
                      <SwiftMessagesTable operationId={selectedOperation.operationId} />
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="events">
                  {/* Ver Eventos: Muestra el diagrama de flujo con el historial y timeline */}
                  {visitedTabs.has('events') && selectedOperation && (
                    <Box pt={4}>
                      <OperationFlowViewer
                        operationId={selectedOperation.operationId}
                        operationType={selectedOperation.productType}
                        currentStage={selectedOperation.stage}
                        currentStatus={selectedOperation.status}
                        showTimeline={true}
                        compact={false}
                      />
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="alerts">
                  {/* Alertas: Muestra el resumen y alertas de la operación */}
                  {selectedOperation && (
                    <Box pt={4}>
                      {loadingAlerts ? (
                        <Box textAlign="center" py={10}>
                          <Spinner size="lg" color={colors.primaryColor} />
                          <Text mt={4} color={colors.textColor}>
                            {t('common.loading')}
                          </Text>
                        </Box>
                      ) : operationSummary ? (
                        <VStack gap={4} align="stretch">
                          {/* Alertas */}
                          {operationSummary.alerts && operationSummary.alerts.length > 0 ? (
                            <VStack gap={3} align="stretch">
                              <Text fontWeight="bold" color={colors.textColor}>
                                {t('operations.activeAlerts', 'Alertas Activas')} ({operationSummary.alerts.length})
                              </Text>
                              {operationSummary.alerts.map((alert, index) => (
                                <Box
                                  key={index}
                                  p={4}
                                  borderRadius="md"
                                  borderWidth="1px"
                                  borderColor={
                                    alert.type === 'DANGER' ? 'red.300' :
                                    alert.type === 'WARNING' ? 'orange.300' :
                                    alert.type === 'INFO' ? 'blue.300' : 'green.300'
                                  }
                                  bg={
                                    alert.type === 'DANGER' ? 'red.50' :
                                    alert.type === 'WARNING' ? 'orange.50' :
                                    alert.type === 'INFO' ? 'blue.50' : 'green.50'
                                  }
                                >
                                  <HStack>
                                    {alert.type === 'DANGER' && <FiAlertCircle color="red" size={20} />}
                                    {alert.type === 'WARNING' && <FiAlertTriangle color="orange" size={20} />}
                                    {alert.type === 'INFO' && <FiInfo color="blue" size={20} />}
                                    {alert.type === 'SUCCESS' && <FiCheckCircle color="green" size={20} />}
                                    <VStack align="start" gap={0}>
                                      <Text fontWeight="medium" color={
                                        alert.type === 'DANGER' ? 'red.700' :
                                        alert.type === 'WARNING' ? 'orange.700' :
                                        alert.type === 'INFO' ? 'blue.700' : 'green.700'
                                      }>
                                        {alert.code}
                                      </Text>
                                      <Text fontSize="sm" color="gray.600">
                                        {alert.message}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                </Box>
                              ))}
                            </VStack>
                          ) : (
                            <Box
                              p={6}
                              textAlign="center"
                              bg="green.50"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="green.200"
                            >
                              <FiCheckCircle size={40} color="green" style={{ margin: '0 auto' }} />
                              <Text mt={3} color="green.700" fontWeight="medium">
                                {t('operations.noAlerts', 'Sin alertas activas')}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                {t('operations.operationHealthy', 'La operación está en buen estado')}
                              </Text>
                            </Box>
                          )}

                          {/* Resumen de montos y fechas */}
                          <Box p={{ base: 3, md: 4 }} bg={colors.cardBg} borderRadius="md" borderWidth="1px" borderColor={colors.borderColor}>
                            <Text fontWeight="bold" color={colors.textColor} mb={3} fontSize={{ base: 'sm', md: 'md' }}>
                              {t('operations.summary', 'Resumen')}
                            </Text>
                            <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: 3, md: 6 }}>
                              <VStack align="start" gap={1}>
                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.currentAmount', 'Monto Actual')}</Text>
                                <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                  {operationSummary.amounts?.currency} {operationSummary.amounts?.currentAmount?.toLocaleString() || '-'}
                                </Text>
                              </VStack>
                              <VStack align="start" gap={1}>
                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.utilization', 'Utilización')}</Text>
                                <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                  {operationSummary.amounts?.utilizationPercentage?.toFixed(1) || 0}%
                                </Text>
                              </VStack>
                              <VStack align="start" gap={1}>
                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.expiryDate', 'Vencimiento')}</Text>
                                <Text fontWeight="medium" color={operationSummary.dates?.expired ? 'red.500' : colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                  {operationSummary.dates?.currentExpiryDate || '-'}
                                  {operationSummary.dates?.daysToExpiry !== undefined && (
                                    <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                                      ({operationSummary.dates.daysToExpiry}d)
                                    </Text>
                                  )}
                                </Text>
                              </VStack>
                              <VStack align="start" gap={1}>
                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.amendments', 'Enmiendas')}</Text>
                                <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                  {operationSummary.totalAmendments || 0}
                                </Text>
                              </VStack>
                            </SimpleGrid>
                          </Box>

                          {/* Partes involucradas */}
                          {operationSummary.parties && (
                            <Box p={{ base: 3, md: 4 }} bg={colors.cardBg} borderRadius="md" borderWidth="1px" borderColor={colors.borderColor}>
                              <Text fontWeight="bold" color={colors.textColor} mb={3} fontSize={{ base: 'sm', md: 'md' }}>
                                {t('operations.parties', 'Partes Involucradas')}
                              </Text>
                              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 3, md: 6 }}>
                                {operationSummary.parties.applicantName && (
                                  <VStack align="start" gap={1}>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.applicant', 'Ordenante')}</Text>
                                    <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                      {operationSummary.parties.applicantName}
                                    </Text>
                                    {operationSummary.parties.applicantAddress && (
                                      <Text fontSize="xs" color="gray.500" isTruncated maxW="100%">{operationSummary.parties.applicantAddress}</Text>
                                    )}
                                  </VStack>
                                )}
                                {operationSummary.parties.beneficiaryName && (
                                  <VStack align="start" gap={1}>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.beneficiary', 'Beneficiario')}</Text>
                                    <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                      {operationSummary.parties.beneficiaryName}
                                    </Text>
                                    {operationSummary.parties.beneficiaryAddress && (
                                      <Text fontSize="xs" color="gray.500" isTruncated maxW="100%">{operationSummary.parties.beneficiaryAddress}</Text>
                                    )}
                                  </VStack>
                                )}
                                {(operationSummary.parties.issuingBankBic || operationSummary.parties.issuingBankName) && (
                                  <VStack align="start" gap={1}>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.issuingBank', 'Banco Emisor')}</Text>
                                    <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                      {operationSummary.parties.issuingBankName || operationSummary.parties.issuingBankBic}
                                    </Text>
                                    {operationSummary.parties.issuingBankName && operationSummary.parties.issuingBankBic && (
                                      <Text fontSize="xs" color="gray.500">{operationSummary.parties.issuingBankBic}</Text>
                                    )}
                                  </VStack>
                                )}
                                {(operationSummary.parties.advisingBankBic || operationSummary.parties.advisingBankName) && (
                                  <VStack align="start" gap={1}>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500">{t('operations.advisingBank', 'Banco Notificador')}</Text>
                                    <Text fontWeight="medium" color={colors.textColor} fontSize={{ base: 'sm', md: 'md' }}>
                                      {operationSummary.parties.advisingBankName || operationSummary.parties.advisingBankBic}
                                    </Text>
                                    {operationSummary.parties.advisingBankName && operationSummary.parties.advisingBankBic && (
                                      <Text fontSize="xs" color="gray.500">{operationSummary.parties.advisingBankBic}</Text>
                                    )}
                                  </VStack>
                                )}
                              </SimpleGrid>
                            </Box>
                          )}
                        </VStack>
                      ) : (
                        <Box textAlign="center" py={8}>
                          <Text color={colors.textColor}>
                            {t('operations.noSummaryAvailable', 'No hay resumen disponible')}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="execute">
                  {/* Ejecutar Evento: Muestra los eventos disponibles para ejecutar */}
                  {visitedTabs.has('execute') && selectedOperation && (
                    <Box pt={4}>
                      {isClosed ? (
                        <Box
                          p={6}
                          bg={isDark ? 'gray.700' : 'gray.50'}
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor={isDark ? 'gray.600' : 'gray.200'}
                          textAlign="center"
                        >
                          <HStack justify="center" mb={3}>
                            <FiCheckCircle size={24} color={isDark ? '#A0AEC0' : '#718096'} />
                            <Text fontSize="lg" fontWeight="bold" color={isDark ? 'gray.300' : 'gray.600'}>
                              {t('operations.closedTitle', 'Operación Cerrada')}
                            </Text>
                          </HStack>
                          <Text color={isDark ? 'gray.400' : 'gray.500'}>
                            {t('operations.closedMessage', 'Esta operación está cerrada y es de solo lectura. No se pueden ejecutar nuevos eventos.')}
                          </Text>
                        </Box>
                      ) : hasPendingApproval ? (
                        <Box
                          p={6}
                          bg="yellow.50"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="yellow.200"
                          textAlign="center"
                        >
                          <HStack justify="center" mb={3}>
                            <FiAlertCircle size={24} color="orange" />
                            <Text fontSize="lg" fontWeight="bold" color="orange.700">
                              {t('operations.pendingApprovalTitle', 'Operación con aprobación pendiente')}
                            </Text>
                          </HStack>
                          <Text color="gray.600">
                            {t('operations.pendingApprovalMessage', 'Esta operación tiene un evento pendiente de aprobación. No se pueden ejecutar nuevos eventos hasta que el evento pendiente sea aprobado o rechazado.')}
                          </Text>
                          <Text mt={3} fontSize="sm" color="gray.500">
                            {t('operations.pendingApprovalHint', 'Visite el Centro de Aprobaciones para revisar los eventos pendientes.')}
                          </Text>
                        </Box>
                      ) : (
                        <EventGuidePanel
                          operation={selectedOperation}
                          onEventExecuted={handleEventExecuted}
                        />
                      )}
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="documents">
                  {/* Documentos: Upload and list documents for this operation */}
                  {visitedTabs.has('documents') && selectedOperation && (
                    <Box pt={4}>
                      <VStack gap={4} align="stretch">
                        {/* Client Request Documents Section */}
                        {(loadingClientDocs || clientRequestDocuments.length > 0) && (
                          <Box
                            p={4}
                            bg="green.50"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="green.200"
                          >
                            <HStack mb={3}>
                              <FiPaperclip color="green" />
                              <Text fontWeight="bold" color="green.700">
                                {t('operations.clientRequestDocuments', 'Documentos de Solicitud del Cliente')}
                              </Text>
                              {clientRequestDocuments.length > 0 && (
                                <Badge colorPalette="green" size="sm">
                                  {clientRequestDocuments.length}
                                </Badge>
                              )}
                            </HStack>
                            {loadingClientDocs ? (
                              <HStack justify="center" py={4}>
                                <Spinner size="sm" color="green.500" />
                                <Text fontSize="sm" color="gray.600">{t('common.loading', 'Cargando...')}</Text>
                              </HStack>
                            ) : (
                              <VStack gap={2} align="stretch">
                                {clientRequestDocuments.map((doc) => (
                                  <Box
                                    key={doc.documentId}
                                    p={3}
                                    bg="white"
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                  >
                                    <HStack justify="space-between">
                                      <VStack align="start" gap={0} flex={1}>
                                        <Text fontWeight="medium" fontSize="sm" color="gray.700">
                                          {doc.originalFileName}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {doc.formattedFileSize || `${(doc.fileSize / 1024).toFixed(1)} KB`}
                                          {doc.uploadedAt && ` • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                                        </Text>
                                      </VStack>
                                      <HStack gap={1}>
                                        {doc.previewUrl && (
                                          <IconButton
                                            aria-label="Ver"
                                            size="sm"
                                            variant="ghost"
                                            colorPalette="blue"
                                            onClick={() => openDocumentWithAuth(doc.previewUrl!)}
                                          >
                                            <FiEye />
                                          </IconButton>
                                        )}
                                        {doc.downloadUrl && (
                                          <IconButton
                                            aria-label="Descargar"
                                            size="sm"
                                            variant="ghost"
                                            colorPalette="green"
                                            onClick={() => downloadDocumentWithAuth(doc.downloadUrl!, doc.originalFileName)}
                                          >
                                            <FiDownload />
                                          </IconButton>
                                        )}
                                      </HStack>
                                    </HStack>
                                  </Box>
                                ))}
                              </VStack>
                            )}
                          </Box>
                        )}

                        {/* Operation Documents Section */}
                        <Box>
                          <Text fontWeight="bold" color={colors.textColor} mb={3}>
                            {t('operations.operationDocuments', 'Documentos de la Operación')}
                          </Text>
                          <DocumentUploader
                            operationId={selectedOperation.operationId}
                            categories={documentCategories}
                            documentTypes={documentTypes}
                            onUploadComplete={() => setDocumentsKey(prev => prev + 1)}
                            onUploadError={(error) => console.error('Upload error:', error)}
                          />
                          <Box mt={4}>
                            <DocumentList
                              key={documentsKey}
                              operationId={selectedOperation.operationId}
                              onRefresh={() => setDocumentsKey(prev => prev + 1)}
                            />
                          </Box>
                        </Box>
                      </VStack>
                    </Box>
                  )}
                </Tabs.Content>
                <Tabs.Content value="accounting">
                  {/* Contabilidad: Asientos contables de la operación */}
                  {visitedTabs.has('accounting') && selectedOperation && (
                    <Box pt={4}>
                      <OperationAccountingPanel
                        operationReference={selectedOperation.reference}
                        productType={selectedOperation.productType}
                      />
                    </Box>
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default WorkboxOperationsPage;
