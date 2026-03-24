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

// Lazy load chat
const CMXChat = lazy(() => import('./components/chat').then(module => ({ default: module.CMXChat })));

// CP (Compras Públicas) pages
import CPDashboardPage from './pages/cp/CPDashboardPage';
import CPMarketStudyPage from './pages/cp/CPMarketStudyPage';
import CPPAAListPage from './pages/cp/CPPAAListPage';
import CPBudgetPage from './pages/cp/CPBudgetPage';
import CPProcessListPage from './pages/cp/CPProcessListPage';

// GptSercop integration pages
import InfimaCuantiaPage from './pages/cp/InfimaCuantiaPage';
import AdvancedSearchPage from './pages/cp/AdvancedSearchPage';

// Auth pages
import { OAuth2Callback } from './pages/auth/OAuth2Callback';
import { FeatureCertificationPage } from './pages/FeatureCertificationPage';
import MfaSettings from './pages/MfaSettings';

// Client portal
import { ClientDashboard, ClientNewRequest, ClientRequestDetail, ClientRequestEdit } from './pages/client';
import { ClientProfile } from './pages/client/ClientProfile';
import { ClientOperations } from './pages/client/ClientOperations';

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

      {/* Admin / Config pages */}
      <Route path="/participants" element={<ProtectedRoute><Dashboard><Participants /></Dashboard></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Dashboard><Users /></Dashboard></ProtectedRoute>} />
      <Route path="/catalogs/custom" element={<ProtectedRoute><Dashboard><CustomCatalogs /></Dashboard></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Dashboard><Templates /></Dashboard></ProtectedRoute>} />
      <Route path="/email-templates" element={<ProtectedRoute><Dashboard><EmailTemplates /></Dashboard></ProtectedRoute>} />
      <Route path="/settings/mfa" element={<ProtectedRoute><Dashboard><MfaSettings /></Dashboard></ProtectedRoute>} />

      {/* Compras Públicas (CP) routes */}
      <Route path="/cp" element={<ProtectedRoute><Dashboard><CPDashboardPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/estudio-mercado" element={<ProtectedRoute><Dashboard><CPMarketStudyPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/paa" element={<ProtectedRoute><Dashboard><CPPAAListPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/presupuesto" element={<ProtectedRoute><Dashboard><CPBudgetPage /></Dashboard></ProtectedRoute>} />
      <Route path="/cp/procesos" element={<ProtectedRoute><Dashboard><CPProcessListPage /></Dashboard></ProtectedRoute>} />

      {/* GptSercop integration routes */}
      <Route path="/cp/infima-cuantia" element={<ProtectedRoute><Dashboard><InfimaCuantiaPage /></Dashboard></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Dashboard><AdvancedSearchPage /></Dashboard></ProtectedRoute>} />

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
                          <Suspense fallback={null}>
                            <CMXChat />
                          </Suspense>
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
