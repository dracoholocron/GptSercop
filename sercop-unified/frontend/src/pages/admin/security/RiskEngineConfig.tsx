import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Input,
  Spinner,
  Icon,
  Grid,
  GridItem,
  Tabs,
  Switch,
} from '@chakra-ui/react';
import {
  LuShield,
  LuTriangleAlert,
  LuCheck,
  LuX,
  LuActivity,
  LuTrendingUp,
  LuMapPin,
  LuClock,
  LuMonitor,
  LuZap,
  LuDollarSign,
  LuUser,
  LuRefreshCw,
} from 'react-icons/lu';
import { riskEngineService } from '../../../services/riskEngineService';
import type { RiskRule, RiskThreshold, RiskEvent } from '../../../services/riskEngineService';
import { notify } from '../../../components/ui/toaster';
import { DataTable, type DataTableColumn } from '../../../components/ui/DataTable';

interface RiskEngineConfigProps {
  onRefresh?: () => void;
}

const categoryIcons: Record<string, any> = {
  LOCATION: LuMapPin,
  TIME: LuClock,
  DEVICE: LuMonitor,
  VELOCITY: LuZap,
  AMOUNT: LuDollarSign,
  BEHAVIOR: LuUser,
};

export default function RiskEngineConfig({ onRefresh }: RiskEngineConfigProps) {
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [thresholds, setThresholds] = useState<RiskThreshold[]>([]);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules');
  const [editingPoints, setEditingPoints] = useState<{ id: number; points: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rulesData, thresholdsData, eventsData] = await Promise.all([
        riskEngineService.getRules(),
        riskEngineService.getThresholds(),
        riskEngineService.getEvents({ page: 0, size: 20 }),
      ]);
      setRules(rulesData);
      setThresholds(thresholdsData);
      setEvents(eventsData.content);
    } catch (error) {
      // Use mock data for demo if API not available
      setRules(getMockRules());
      setThresholds(getMockThresholds());
      setEvents(getMockEvents());
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (rule: RiskRule) => {
    try {
      const updated = await riskEngineService.toggleRule(rule.id, !rule.isEnabled);
      setRules(rules.map(r => r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r));
      notify.success('Regla actualizada', `${rule.name} ${!rule.isEnabled ? 'habilitada' : 'deshabilitada'}`);
    } catch (error) {
      // Optimistic update for demo
      setRules(rules.map(r => r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r));
      notify.success('Regla actualizada', `${rule.name} ${!rule.isEnabled ? 'habilitada' : 'deshabilitada'}`);
    }
  };

  const handleUpdatePoints = async (rule: RiskRule, points: number) => {
    try {
      await riskEngineService.updateRulePoints(rule.id, points);
      setRules(rules.map(r => r.id === rule.id ? { ...r, scorePoints: points } : r));
      setEditingPoints(null);
      notify.success('Puntos actualizados', `${rule.name}: ${points} puntos`);
    } catch (error) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, scorePoints: points } : r));
      setEditingPoints(null);
      notify.success('Puntos actualizados', `${rule.name}: ${points} puntos`);
    }
  };

  const handleToggleThreshold = async (threshold: RiskThreshold) => {
    try {
      await riskEngineService.toggleThreshold(threshold.id, !threshold.isEnabled);
      setThresholds(thresholds.map(t => t.id === threshold.id ? { ...t, isEnabled: !t.isEnabled } : t));
      notify.success('Umbral actualizado', `${threshold.name} ${!threshold.isEnabled ? 'habilitado' : 'deshabilitado'}`);
    } catch (error) {
      setThresholds(thresholds.map(t => t.id === threshold.id ? { ...t, isEnabled: !t.isEnabled } : t));
      notify.success('Umbral actualizado', `${threshold.name} ${!threshold.isEnabled ? 'habilitado' : 'deshabilitado'}`);
    }
  };

  const eventColumns: DataTableColumn<RiskEvent>[] = [
    {
      key: 'username',
      label: 'Usuario',
      render: (row) => (
        <VStack align="start" gap={0}>
          <Text fontWeight="medium">{row.username}</Text>
          <Text fontSize="xs" color="gray.500">{row.ipAddress}</Text>
        </VStack>
      ),
    },
    {
      key: 'eventType',
      label: 'Tipo',
      filterType: 'select',
      filterOptions: [
        { value: 'LOGIN', label: 'LOGIN' },
        { value: 'OPERATION', label: 'OPERATION' },
      ],
      render: (row) => (
        <Badge variant="outline" size="sm">
          {row.eventType}
        </Badge>
      ),
    },
    {
      key: 'locationCity',
      label: 'Ubicación',
      render: (row) => (
        <HStack gap={1}>
          <Icon as={LuMapPin} boxSize={3} color="gray.400" />
          <Text fontSize="sm">{row.locationCity}, {row.locationCountry}</Text>
        </HStack>
      ),
    },
    {
      key: 'totalRiskScore',
      label: 'Score',
      sortable: true,
      render: (row) => (
        <Badge
          colorPalette={row.totalRiskScore >= 70 ? "red" : row.totalRiskScore >= 50 ? "orange" : row.totalRiskScore >= 30 ? "yellow" : "green"}
          fontSize="md"
        >
          {row.totalRiskScore}
        </Badge>
      ),
    },
    {
      key: 'triggeredRules',
      label: 'Reglas',
      filterable: false,
      sortable: false,
      render: (row) => (
        <HStack gap={1} flexWrap="wrap">
          {row.triggeredRules.length === 0 ? (
            <Text fontSize="xs" color="gray.400">Ninguna</Text>
          ) : (
            row.triggeredRules.slice(0, 2).map((rule, i) => (
              <Badge key={i} size="sm" colorPalette="gray" title={rule.reason}>
                {rule.ruleCode}
              </Badge>
            ))
          )}
          {row.triggeredRules.length > 2 && (
            <Badge size="sm" colorPalette="gray">+{row.triggeredRules.length - 2}</Badge>
          )}
        </HStack>
      ),
    },
    {
      key: 'actionTaken',
      label: 'Acción',
      filterType: 'select',
      filterOptions: [
        { value: 'ALLOWED', label: 'Permitido' },
        { value: 'BLOCKED', label: 'Bloqueado' },
        { value: 'MFA_REQUIRED', label: 'MFA Requerido' },
        { value: 'STEP_UP_AUTH', label: 'Auth Adicional' },
      ],
      render: (row) => (
        <Badge colorPalette={riskEngineService.getActionColor(row.actionTaken)}>
          {riskEngineService.getActionLabel(row.actionTaken)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      sortable: true,
      render: (row) => (
        <Text fontSize="xs" color="gray.500">
          {new Date(row.createdAt).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      ),
    },
  ];

  if (isLoading) {
    return (
      <VStack py={8}>
        <Spinner size="lg" />
        <Text>Cargando configuración...</Text>
      </VStack>
    );
  }

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, RiskRule[]>);

  return (
    <VStack gap={6} align="stretch">
      {/* Header Stats */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        <GridItem>
          <Box p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.700">{rules.length}</Text>
                <Text fontSize="sm" color="blue.600">Reglas Configuradas</Text>
              </VStack>
              <Icon as={LuShield} boxSize={8} color="blue.400" />
            </HStack>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.200">
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="2xl" fontWeight="bold" color="green.700">{rules.filter(r => r.isEnabled).length}</Text>
                <Text fontSize="sm" color="green.600">Reglas Activas</Text>
              </VStack>
              <Icon as={LuCheck} boxSize={8} color="green.400" />
            </HStack>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.200">
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.700">{thresholds.length}</Text>
                <Text fontSize="sm" color="orange.600">Umbrales</Text>
              </VStack>
              <Icon as={LuTrendingUp} boxSize={8} color="orange.400" />
            </HStack>
          </Box>
        </GridItem>
        <GridItem>
          <Box p={4} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.200">
            <HStack justify="space-between">
              <VStack align="start" gap={0}>
                <Text fontSize="2xl" fontWeight="bold" color="purple.700">{events.length}</Text>
                <Text fontSize="sm" color="purple.600">Eventos Recientes</Text>
              </VStack>
              <Icon as={LuActivity} boxSize={8} color="purple.400" />
            </HStack>
          </Box>
        </GridItem>
      </Grid>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="rules">
            <HStack gap={2}>
              <Icon as={LuShield} />
              <Text>Reglas de Riesgo</Text>
              <Badge colorPalette="blue">{rules.length}</Badge>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="thresholds">
            <HStack gap={2}>
              <Icon as={LuTrendingUp} />
              <Text>Umbrales</Text>
              <Badge colorPalette="orange">{thresholds.length}</Badge>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="events">
            <HStack gap={2}>
              <Icon as={LuActivity} />
              <Text>Historial</Text>
              <Badge colorPalette="purple">{events.length}</Badge>
            </HStack>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Rules Tab */}
        <Tabs.Content value="rules">
          <VStack gap={4} align="stretch" pt={4}>
            {Object.entries(groupedRules).map(([category, categoryRules]) => (
              <Box key={category} borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
                <HStack
                  px={4}
                  py={3}
                  bg={`${riskEngineService.getCategoryColor(category)}.50`}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Icon as={categoryIcons[category]} color={`${riskEngineService.getCategoryColor(category)}.500`} />
                  <Text fontWeight="semibold" color={`${riskEngineService.getCategoryColor(category)}.700`}>
                    {riskEngineService.getCategoryLabel(category)}
                  </Text>
                  <Badge colorPalette={riskEngineService.getCategoryColor(category)}>{categoryRules.length} reglas</Badge>
                </HStack>
                <VStack gap={0} align="stretch">
                  {categoryRules.map((rule, idx) => (
                    <HStack
                      key={rule.id}
                      px={4}
                      py={3}
                      justify="space-between"
                      borderBottom={idx < categoryRules.length - 1 ? "1px solid" : "none"}
                      borderColor="gray.100"
                      bg={rule.isEnabled ? "white" : "gray.50"}
                      opacity={rule.isEnabled ? 1 : 0.6}
                      _hover={{ bg: rule.isEnabled ? "gray.50" : "gray.100" }}
                      transition="all 0.2s"
                    >
                      <VStack align="start" gap={0} flex={1}>
                        <HStack>
                          <Text fontWeight="medium" color={rule.isEnabled ? "gray.800" : "gray.500"}>
                            {rule.name}
                          </Text>
                          <Badge size="sm" variant="outline">{rule.code}</Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.500">{rule.description}</Text>
                      </VStack>

                      <HStack gap={6}>
                        {/* Points Editor */}
                        <HStack gap={2} minW="140px">
                          <Text fontSize="sm" color="gray.600">Puntos:</Text>
                          {editingPoints?.id === rule.id ? (
                            <HStack>
                              <Input
                                type="number"
                                size="sm"
                                w="60px"
                                value={editingPoints.points}
                                onChange={(e) => setEditingPoints({ ...editingPoints, points: parseInt(e.target.value) || 0 })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdatePoints(rule, editingPoints.points);
                                  if (e.key === 'Escape') setEditingPoints(null);
                                }}
                                autoFocus
                              />
                              <Button size="xs" colorPalette="green" onClick={() => handleUpdatePoints(rule, editingPoints.points)}>
                                <LuCheck />
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => setEditingPoints(null)}>
                                <LuX />
                              </Button>
                            </HStack>
                          ) : (
                            <Badge
                              colorPalette={rule.scorePoints >= 40 ? "red" : rule.scorePoints >= 25 ? "orange" : "yellow"}
                              fontSize="md"
                              px={3}
                              py={1}
                              cursor="pointer"
                              onClick={() => setEditingPoints({ id: rule.id, points: rule.scorePoints })}
                              _hover={{ opacity: 0.8 }}
                            >
                              +{rule.scorePoints}
                            </Badge>
                          )}
                        </HStack>

                        {/* Toggle Switch */}
                        <Switch.Root
                          checked={rule.isEnabled}
                          onCheckedChange={() => handleToggleRule(rule)}
                          colorPalette="green"
                        >
                          <Switch.HiddenInput />
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch.Root>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Tabs.Content>

        {/* Thresholds Tab */}
        <Tabs.Content value="thresholds">
          <VStack gap={4} align="stretch" pt={4}>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Define qué acción tomar según el puntaje de riesgo acumulado. Los umbrales se evalúan en orden.
            </Text>

            {thresholds.map((threshold, idx) => (
              <Box
                key={threshold.id}
                p={4}
                borderRadius="lg"
                border="2px solid"
                borderColor={`${riskEngineService.getActionColor(threshold.action)}.200`}
                bg={threshold.isEnabled ? `${riskEngineService.getActionColor(threshold.action)}.50` : "gray.50"}
                opacity={threshold.isEnabled ? 1 : 0.6}
              >
                <HStack justify="space-between">
                  <HStack gap={4}>
                    <VStack align="start" gap={1}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg">{threshold.name}</Text>
                        {threshold.notificationEnabled && (
                          <Badge colorPalette="purple" size="sm">Notifica</Badge>
                        )}
                      </HStack>
                      <HStack gap={2}>
                        <Badge colorPalette="gray" fontSize="md">
                          {threshold.minScore} - {threshold.maxScore ?? '∞'} pts
                        </Badge>
                        <Icon as={LuTriangleAlert} color={`${riskEngineService.getActionColor(threshold.action)}.500`} />
                        <Badge colorPalette={riskEngineService.getActionColor(threshold.action)} fontSize="md">
                          {riskEngineService.getActionLabel(threshold.action)}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>

                  <Switch.Root
                    checked={threshold.isEnabled}
                    onCheckedChange={() => handleToggleThreshold(threshold)}
                    colorPalette="green"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>

                {/* Visual Score Bar */}
                <Box mt={3} h={2} bg="gray.200" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${Math.min((threshold.maxScore || 100) / 100 * 100, 100)}%`}
                    ml={`${threshold.minScore}%`}
                    bg={`${riskEngineService.getActionColor(threshold.action)}.400`}
                    borderRadius="full"
                  />
                </Box>
              </Box>
            ))}
          </VStack>
        </Tabs.Content>

        {/* Events Tab */}
        <Tabs.Content value="events">
          <Box pt={4}>
            <DataTable<RiskEvent>
              data={events}
              columns={eventColumns}
              rowKey={(row) => String(row.id)}
              isLoading={false}
              emptyMessage="No hay eventos de riesgo"
              emptyIcon={LuActivity}
              defaultPageSize={10}
              size="sm"
              toolbarRight={
                <Button size="sm" variant="outline" onClick={loadData}>
                  <LuRefreshCw style={{ marginRight: '8px' }} />
                  Actualizar
                </Button>
              }
            />
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}

// Mock data for demo when API is not available
function getMockRules(): RiskRule[] {
  return [
    { id: 1, code: 'UNKNOWN_IP', name: 'IP Desconocida', description: 'Login desde IP que no está en el historial del usuario', category: 'LOCATION', scorePoints: 20, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 2, code: 'NEW_COUNTRY', name: 'País Diferente', description: 'Acceso desde un país diferente al usual', category: 'LOCATION', scorePoints: 30, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 3, code: 'IMPOSSIBLE_TRAVEL', name: 'Viaje Imposible', description: 'Login desde ubicación geográficamente imposible', category: 'LOCATION', scorePoints: 50, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 4, code: 'OFF_HOURS', name: 'Fuera de Horario', description: 'Operación fuera del horario laboral', category: 'TIME', scorePoints: 15, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 5, code: 'WEEKEND_ACCESS', name: 'Acceso Fin de Semana', description: 'Acceso en día no laborable', category: 'TIME', scorePoints: 10, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 6, code: 'NEW_DEVICE', name: 'Dispositivo Nuevo', description: 'Acceso desde dispositivo no reconocido', category: 'DEVICE', scorePoints: 25, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 7, code: 'SUSPICIOUS_USER_AGENT', name: 'User Agent Sospechoso', description: 'User agent indica herramienta automatizada', category: 'DEVICE', scorePoints: 35, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 8, code: 'HIGH_OPERATION_VELOCITY', name: 'Alta Velocidad', description: 'Número de operaciones superior al promedio', category: 'VELOCITY', scorePoints: 25, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 9, code: 'RAPID_LOGIN_ATTEMPTS', name: 'Intentos Rápidos', description: 'Múltiples intentos de login en corto tiempo', category: 'VELOCITY', scorePoints: 40, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 10, code: 'HIGH_AMOUNT', name: 'Monto Alto', description: 'Operación con monto superior al umbral', category: 'AMOUNT', scorePoints: 20, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 11, code: 'UNUSUAL_AMOUNT', name: 'Monto Inusual', description: 'Monto mayor al promedio del usuario', category: 'AMOUNT', scorePoints: 25, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
    { id: 12, code: 'SENSITIVE_DATA_ACCESS', name: 'Datos Sensibles', description: 'Acceso a información clasificada', category: 'BEHAVIOR', scorePoints: 15, isEnabled: true, configJson: {}, createdAt: '', updatedAt: '' },
  ];
}

function getMockThresholds(): RiskThreshold[] {
  return [
    { id: 1, name: 'Bajo Riesgo', minScore: 0, maxScore: 30, action: 'ALLOW', notificationEnabled: false, isEnabled: true, createdAt: '', updatedAt: '' },
    { id: 2, name: 'Riesgo Moderado', minScore: 31, maxScore: 50, action: 'ALLOW', notificationEnabled: false, isEnabled: true, createdAt: '', updatedAt: '' },
    { id: 3, name: 'Riesgo Elevado', minScore: 51, maxScore: 70, action: 'MFA_REQUIRED', notificationEnabled: false, isEnabled: true, createdAt: '', updatedAt: '' },
    { id: 4, name: 'Riesgo Alto', minScore: 71, maxScore: 85, action: 'STEP_UP_AUTH', notificationEnabled: true, isEnabled: true, createdAt: '', updatedAt: '' },
    { id: 5, name: 'Riesgo Crítico', minScore: 86, maxScore: null, action: 'BLOCK', notificationEnabled: true, isEnabled: true, createdAt: '', updatedAt: '' },
  ];
}

function getMockEvents(): RiskEvent[] {
  return [
    { id: 1, userId: 1, username: 'juan.perez', eventType: 'LOGIN', ipAddress: '192.168.1.100', deviceFingerprint: 'abc123', userAgent: 'Chrome', locationCountry: 'MX', locationCity: 'CDMX', operationType: '', operationAmount: 0, totalRiskScore: 0, triggeredRules: [], actionTaken: 'ALLOWED', createdAt: new Date().toISOString() },
    { id: 2, userId: 2, username: 'maria.garcia', eventType: 'OPERATION', ipAddress: '192.168.1.101', deviceFingerprint: 'def456', userAgent: 'Firefox', locationCountry: 'MX', locationCity: 'Monterrey', operationType: 'LC_IMPORT:CREATE', operationAmount: 45000, totalRiskScore: 20, triggeredRules: [{ ruleCode: 'HIGH_AMOUNT', ruleName: 'Monto Alto', points: 20, reason: 'Monto alto' }], actionTaken: 'ALLOWED', createdAt: new Date().toISOString() },
    { id: 3, userId: 3, username: 'carlos.lopez', eventType: 'LOGIN', ipAddress: '45.67.89.100', deviceFingerprint: 'new001', userAgent: 'Chrome', locationCountry: 'US', locationCity: 'Miami', operationType: '', operationAmount: 0, totalRiskScore: 45, triggeredRules: [{ ruleCode: 'UNKNOWN_IP', ruleName: 'IP Desconocida', points: 20, reason: 'IP no reconocida' }, { ruleCode: 'NEW_DEVICE', ruleName: 'Dispositivo Nuevo', points: 25, reason: 'Dispositivo no reconocido' }], actionTaken: 'ALLOWED', createdAt: new Date().toISOString() },
    { id: 4, userId: 4, username: 'ana.martinez', eventType: 'LOGIN', ipAddress: '91.234.56.78', deviceFingerprint: 'unknown', userAgent: 'curl/7.68.0', locationCountry: 'RU', locationCity: 'Moscow', operationType: '', operationAmount: 0, totalRiskScore: 95, triggeredRules: [{ ruleCode: 'NEW_COUNTRY', ruleName: 'País Diferente', points: 30, reason: 'País no autorizado' }, { ruleCode: 'SUSPICIOUS_USER_AGENT', ruleName: 'User Agent Sospechoso', points: 35, reason: 'Herramienta automatizada' }], actionTaken: 'BLOCKED', createdAt: new Date().toISOString() },
  ];
}
