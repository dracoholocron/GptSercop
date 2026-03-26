import { ChakraProvider, Box, Spinner, Text, VStack, Button } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, Component, type ErrorInfo, type ReactNode } from 'react';
import system from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandProvider } from './contexts/BrandContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ScheduleProvider, useSchedule } from './contexts/ScheduleContext';
import { CorporationProvider } from './contexts/CorporationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { ResponsiveProvider } from './hooks/useResponsive';
import { Toaster } from './components/ui/toaster';
import { usePermissions } from './hooks/usePermissions';
import ScheduleBlockedPage from './pages/ScheduleBlockedPage';
import './styles/mobile.css';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Participants } from './pages/Participants';
import { Users } from './pages/Users';
import { CustomCatalogs } from './pages/CustomCatalogs';
import { Templates } from './pages/Templates';
import { EmailTemplates } from './pages/EmailTemplates';
import { AlertNotificationListener } from './components/alerts/AlertNotificationListener';
import AIPromptConfigAdmin from './pages/AIPromptConfigAdmin';
import AIUsageReportsPage from './pages/admin/AIUsageReportsPage';

// Lazy load chat
const CMXChat = lazy(() => import('./components/chat').then(module => ({ default: module.CMXChat })));

// CP (Compras Públicas) pages
import CPDashboardPage from './pages/cp/CPDashboardPage';
import CPMarketStudyPage from './pages/cp/CPMarketStudyPage';
import CPPAAListPage from './pages/cp/CPPAAListPage';
import CPBudgetPage from './pages/cp/CPBudgetPage';
import CPProcessListPage from './pages/cp/CPProcessListPage';
import CPRiskDashboardPage from './pages/cp/CPRiskDashboardPage';
import CPAIAssistantPage from './pages/CPAIAssistantPage';

// GptSercop integration pages
import InfimaCuantiaPage from './pages/cp/InfimaCuantiaPage';
import AdvancedSearchPage from './pages/cp/AdvancedSearchPage';

// Auth pages
import { OAuth2Callback } from './pages/auth/OAuth2Callback';
import { FeatureCertificationPage } from './pages/FeatureCertificationPage';
import MfaSettings from './pages/MfaSettings';
import MobileHomeDashboard from './pages/MobileHomeDashboard';
import AIAnalysis from './pages/AIAnalysis';

// Client portal
import { ClientDashboard, ClientNewRequest, ClientRequestDetail, ClientRequestEdit } from './pages/client';
import { ClientProfile } from './pages/client/ClientProfile';
import { ClientOperations } from './pages/client/ClientOperations';
import { WorkboxOperationsPage } from './components/operations';

// -- Global Error Boundary --
class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[GlobalErrorBoundary] App crashed:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
              Error de Inicialización
            </h1>
            <div style={{ 
              backgroundColor: '#fee2e2', 
              padding: '1rem', 
              borderRadius: '0.375rem', 
              border: '1px solid #fecaca', 
              textAlign: 'left',
              width: '100%'
            }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', color: '#b91c1c', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {this.state.error?.message}
              </pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// -- Protected Route --
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// -- Schedule Gate --
const ScheduleGate = ({ children }: { children: ReactNode }) => {
  const { isBlocked } = useSchedule();
  if (isBlocked) return <ScheduleBlockedPage />;
  return <>{children}</>;
};

// -- Permission Route --
const PermissionRoute = ({
  anyOf,
  children,
}: {
  anyOf: string[];
  children: ReactNode;
}) => {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="50vh">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!hasAnyPermission(anyOf)) {
    return (
      <Box p={8}>
        <VStack align="start" gap={3}>
          <Text fontSize="xl" fontWeight="bold">Acceso restringido</Text>
          <Text color="gray.500">
            Tu usuario no tiene permisos para acceder a este modulo.
          </Text>
          <Button onClick={() => window.history.back()}>Volver</Button>
        </VStack>
      </Box>
    );
  }

  return <>{children}</>;
};

// -- App Router --
function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/oauth2/callback" element={<OAuth2Callback />} />
      <Route path="/feature-certification" element={<FeatureCertificationPage />} />

      {/* Main dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          <ScheduleGate>
            <Dashboard />
          </ScheduleGate>
        </ProtectedRoute>
      } />
      <Route path="/mobile-home" element={<ProtectedRoute><Dashboard><MobileHomeDashboard /></Dashboard></ProtectedRoute>} />

      {/* Admin / Config pages */}
      <Route path="/participants" element={<ProtectedRoute><Dashboard><Participants /></Dashboard></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Dashboard><Users /></Dashboard></ProtectedRoute>} />
      <Route path="/catalogs/custom" element={<ProtectedRoute><Dashboard><CustomCatalogs /></Dashboard></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Dashboard><Templates /></Dashboard></ProtectedRoute>} />
      <Route path="/email-templates" element={<ProtectedRoute><Dashboard><EmailTemplates /></Dashboard></ProtectedRoute>} />
      <Route path="/settings/mfa" element={<ProtectedRoute><Dashboard><MfaSettings /></Dashboard></ProtectedRoute>} />
      <Route path="/admin/ai-prompts" element={<ProtectedRoute><PermissionRoute anyOf={['AI_PROMPT_VIEW', 'GPT_ADMIN_VIEW']}><Dashboard><AIPromptConfigAdmin /></Dashboard></PermissionRoute></ProtectedRoute>} />
      <Route path="/admin/ai-usage" element={<ProtectedRoute><PermissionRoute anyOf={['CAN_VIEW_AI_STATS', 'GPT_ADMIN_VIEW']}><Dashboard><AIUsageReportsPage /></Dashboard></PermissionRoute></ProtectedRoute>} />

      {/* Compras Públicas (CP) routes */}
      <Route path="/cp" element={<ProtectedRoute><Dashboard><CPDashboardPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/estudio-mercado" element={<ProtectedRoute><Dashboard><CPMarketStudyPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/paa" element={<ProtectedRoute><Dashboard><CPPAAListPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/presupuesto" element={<ProtectedRoute><Dashboard><CPBudgetPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/procesos" element={<ProtectedRoute><Dashboard><CPProcessListPage /></Dashboard></ProtectedRoute>} />
      {/* CP aliases used by menu seeds */}
      <Route path="/cp/dashboard" element={<ProtectedRoute><Dashboard><CPDashboardPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/processes" element={<ProtectedRoute><Dashboard><CPProcessListPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/budget" element={<ProtectedRoute><Dashboard><CPBudgetPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/market" element={<ProtectedRoute><Dashboard><CPMarketStudyPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/risk" element={<ProtectedRoute><PermissionRoute anyOf={['CP_AI_RISK_ANALYSIS', 'GPT_RISK_VIEW']}><Dashboard><CPRiskDashboardPage /></Dashboard></PermissionRoute></ProtectedRoute>} />
      <Route path="/cp/ai-assistant" element={<ProtectedRoute><PermissionRoute anyOf={['CP_AI_ASSISTANT', 'GPT_ASSISTANT_VIEW']}><Dashboard><CPAIAssistantPage /></Dashboard></PermissionRoute></ProtectedRoute>} />
      <Route path="/cp/ai-assistant/extraction" element={<ProtectedRoute><PermissionRoute anyOf={['GPT_SEARCH_VIEW', 'CP_AI_ASSISTANT']}><Navigate to="/cp/ai-assistant?tab=extraction" replace /></PermissionRoute></ProtectedRoute>} />
      <Route path="/cp/ai-assistant/generator" element={<ProtectedRoute><PermissionRoute anyOf={['GPT_ASSISTANT_USE', 'CP_AI_ASSISTANT']}><Navigate to="/cp/ai-assistant?tab=generator" replace /></PermissionRoute></ProtectedRoute>} />

      {/* GptSercop integration routes */}
      <Route path="/cp/infima-cuantia" element={<ProtectedRoute><PermissionRoute anyOf={['CP_VIEW_PROCESSES', 'GPT_SEARCH_VIEW']}><Dashboard><InfimaCuantiaPage /></Dashboard></PermissionRoute></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><PermissionRoute anyOf={['CP_AI_ASSISTANT', 'GPT_SEARCH_VIEW']}><Dashboard><AdvancedSearchPage /></Dashboard></PermissionRoute></ProtectedRoute>} />

      {/* Legacy-First routes (menu compatibility) */}
      <Route path="/workbox" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="LC_IMPORT" titleKey="menu.workbox" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/drafts" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="LC_IMPORT" titleKey="menu.drafts" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/pending-approval" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="LC_IMPORT" titleKey="menu.pendingApproval" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/standby-lc" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="STANDBY_LC" titleKey="menu.standbyLc" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/collection-imports" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_IMPORT" titleKey="menu.collectionImports" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/collection-exports" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_EXPORT" titleKey="menu.collectionExports" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/guarantee-mandataria" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="GUARANTEE_MANDATARIA" titleKey="menu.guaranteeMandataria" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/trade-financing" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="TRADE_FINANCING" titleKey="menu.tradeFinancing" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/workbox/aval-descuento" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="AVAL_DESCUENTO" titleKey="menu.avalDescuento" subtitleKey="workbox.operations.subtitle" defaultViewMode="expiry" /></Dashboard></ProtectedRoute>} />
      <Route path="/ai-analysis/chat" element={<ProtectedRoute><Dashboard><AIAnalysis /></Dashboard></ProtectedRoute>} />

      {/* Product wizard/expert aliases used by legacy menu */}
      <Route path="/standby-lc/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="STANDBY_LC" titleKey="menu.standbyLc" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/standby-lc/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="STANDBY_LC" titleKey="menu.standbyLc" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/collection-imports/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_IMPORT" titleKey="menu.collectionImports" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/collection-imports/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_IMPORT" titleKey="menu.collectionImports" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/collection-exports/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_EXPORT" titleKey="menu.collectionExports" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/collection-exports/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="COLLECTION_EXPORT" titleKey="menu.collectionExports" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/guarantee-mandataria/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="GUARANTEE_MANDATARIA" titleKey="menu.guaranteeMandataria" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/guarantee-mandataria/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="GUARANTEE_MANDATARIA" titleKey="menu.guaranteeMandataria" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/trade-financing/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="TRADE_FINANCING" titleKey="menu.tradeFinancing" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/trade-financing/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="TRADE_FINANCING" titleKey="menu.tradeFinancing" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/aval-descuento/wizard" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="AVAL_DESCUENTO" titleKey="menu.avalDescuento" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />
      <Route path="/aval-descuento/expert" element={<ProtectedRoute><Dashboard><WorkboxOperationsPage productType="AVAL_DESCUENTO" titleKey="menu.avalDescuento" subtitleKey="workbox.operations.subtitle" defaultViewMode="table" /></Dashboard></ProtectedRoute>} />

      {/* Client portal */}
      <Route path="/client" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/operations" element={<ProtectedRoute><ClientOperations /></ProtectedRoute>} />
      <Route path="/client/requests/new" element={<ProtectedRoute><ClientNewRequest /></ProtectedRoute>} />
      <Route path="/client/requests/:id" element={<ProtectedRoute><ClientRequestDetail /></ProtectedRoute>} />
      <Route path="/client/requests/:id/edit" element={<ProtectedRoute><ClientRequestEdit /></ProtectedRoute>} />
      <Route path="/client/profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// -- Main App Component --
function App() {
  const enableCmxChat = import.meta.env.VITE_ENABLE_CMX_CHAT !== 'false';

  return (
    <GlobalErrorBoundary>
      <ChakraProvider value={system}>
        <BrowserRouter>
          <AuthProvider>
            <SystemConfigProvider>
              <ScheduleProvider>
                <CorporationProvider>
                  <BrandProvider>
                    <ThemeProvider>
                      <ResponsiveProvider>
                        <SidebarProvider>
                          <Toaster />
                          <Suspense fallback={
                            <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
                              <Spinner size="xl" color="blue.500" />
                            </Box>
                          }>
                            <AppRouter />
                          </Suspense>
                          {enableCmxChat ? (
                            <Suspense fallback={null}>
                              <CMXChat />
                            </Suspense>
                          ) : null}
                          <AlertNotificationListener />
                        </SidebarProvider>
                      </ResponsiveProvider>
                    </ThemeProvider>
                  </BrandProvider>
                </CorporationProvider>
              </ScheduleProvider>
            </SystemConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </ChakraProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
