/**
 * ProductTypeConfigAdmin - Admin page for managing product type configurations
 * Centralized mapping between product types and their UI views/wizards
 */
import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Heading,
  Card,
  Alert,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { toaster } from '../../components/ui/toaster';
import {
  FiSettings,
  FiLink,
  FiFileText,
  FiCheck,
  FiX,
  FiEdit2,
  FiSave,
  FiDollarSign,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { productTypeConfigService, type ProductTypeConfig } from '../../services/productTypeConfigService';
import { API_BASE_URL_WITH_PREFIX as API_BASE_URL, TOKEN_STORAGE_KEY } from '../../config/api.config';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';

// Categories with labels
const categoryLabels: Record<string, string> = {
  LETTERS_OF_CREDIT: 'Cartas de Crédito',
  GUARANTEES: 'Garantías',
  COLLECTIONS: 'Cobranzas',
  TRADE_FINANCE: 'Financiamiento de Comercio',
};

// Get category badge color
const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'LETTERS_OF_CREDIT':
      return 'blue';
    case 'GUARANTEES':
      return 'purple';
    case 'COLLECTIONS':
      return 'orange';
    default:
      return 'gray';
  }
};

export const ProductTypeConfigAdmin = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [configs, setConfigs] = useState<ProductTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productTypeConfigService.getAllConfigs();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: ProductTypeConfig) => {
    setEditingId(config.id);
    setEditValue(config.accountPrefix || '');
  };

  const handleSave = async (configId: number) => {
    setSaving(true);
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const response = await fetch(`${API_BASE_URL}/product-type-config/${configId}/account-prefix`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ accountPrefix: editValue || null }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      // Update local state
      setConfigs(prev => prev.map(c =>
        c.id === configId ? { ...c, accountPrefix: editValue || undefined } : c
      ));
      setEditingId(null);
      toaster.create({
        title: t('common.success', 'Éxito'),
        description: t('productTypeConfig.accountPrefixSaved', 'Prefijo de cuenta guardado'),
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      toaster.create({
        title: t('common.error', 'Error'),
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const columns: DataTableColumn<ProductTypeConfig>[] = [
    {
      key: 'productType', label: t('productTypeConfig.productType', 'Tipo de Producto'),
      render: (row) => (
        <HStack gap={2}>
          <FiFileText size={16} color={colors.primaryColor} />
          <Text fontWeight="medium" color={colors.textColor}>{row.productType}</Text>
        </HStack>
      ),
    },
    {
      key: 'category', label: t('productTypeConfig.category', 'Categoría'),
      filterType: 'select',
      filterOptions: Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
      render: (row) => <Badge colorPalette={getCategoryColor(row.category)}>{categoryLabels[row.category] || row.category}</Badge>,
    },
    {
      key: 'accountPrefix', label: t('productTypeConfig.accountPrefix', 'Cuenta Contable'),
      render: (row) => editingId === row.id ? (
        <HStack gap={1}>
          <Input
            size="sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Ej: 640290011000000000"
            fontFamily="mono"
            minW="220px"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave(row.id);
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <IconButton aria-label="Guardar" size="xs" colorPalette="green" onClick={() => handleSave(row.id)} loading={saving}>
            <FiSave size={14} />
          </IconButton>
          <IconButton aria-label="Cancelar" size="xs" variant="ghost" onClick={handleCancel}>
            <FiX size={14} />
          </IconButton>
        </HStack>
      ) : (
        <HStack gap={2}>
          <Text fontSize="sm" color={colors.textColor} fontFamily="mono">{row.accountPrefix || '-'}</Text>
          <IconButton aria-label="Editar" size="xs" variant="ghost" onClick={() => handleEdit(row)}>
            <FiEdit2 size={14} />
          </IconButton>
        </HStack>
      ),
    },
    { key: 'baseUrl', label: t('productTypeConfig.baseUrl', 'URL Base'), hideOnMobile: true, render: (row) => <Text fontSize="sm" fontFamily="mono">{row.baseUrl}</Text> },
    { key: 'wizardUrl', label: t('productTypeConfig.wizardUrl', 'URL Wizard'), hideOnMobile: true, render: (row) => <Text fontSize="sm" fontFamily="mono">{row.wizardUrl}</Text> },
    { key: 'swiftMessageType', label: t('productTypeConfig.swiftType', 'SWIFT'), hideOnMobile: true, render: (row) => <Badge colorPalette="gray">{row.swiftMessageType || '-'}</Badge> },
    {
      key: 'active', label: t('productTypeConfig.active', 'Activo'), align: 'center',
      filterType: 'select', filterOptions: [{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }],
      render: (row) => row.active ? <FiCheck color="green" size={18} /> : <FiX color="red" size={18} />,
    },
  ];

  return (
    <Box p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack gap={3}>
            <Box p={2} borderRadius="lg" bg={`${colors.primaryColor}20`}>
              <FiSettings size={24} color={colors.primaryColor} />
            </Box>
            <Box>
              <Heading size="lg" color={colors.textColor}>
                {t('productTypeConfig.title', 'Configuración de Tipos de Producto')}
              </Heading>
              <Text color={colors.textColor} opacity={0.7}>
                {t('productTypeConfig.subtitle', 'Mapeo centralizado entre tipos de operación y sus vistas/wizards')}
              </Text>
            </Box>
          </HStack>
        </Flex>

        {/* Error Alert */}
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t('common.error', 'Error')}</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* Info Card */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Body>
            <HStack gap={3}>
              <FiLink size={20} color={colors.primaryColor} />
              <Text color={colors.textColor}>
                {t('productTypeConfig.info',
                  'Esta tabla define qué formulario y título se abre al consultar una operación según su tipo de producto. ' +
                  'Los cambios en esta configuración afectan la navegación en toda la aplicación.'
                )}
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Configurations DataTable */}
        <DataTable<ProductTypeConfig>
          data={configs}
          columns={columns}
          rowKey={(row) => String(row.id)}
          isLoading={loading}
          emptyMessage={t('common.noData', 'No hay datos')}
          pagination="none"
          size="sm"
        />

        {/* Description Legend */}
        <Card.Root bg={colors.cardBg} borderColor={colors.borderColor}>
          <Card.Header>
            <Heading size="sm" color={colors.textColor}>
              {t('productTypeConfig.descriptions', 'Descripciones')}
            </Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={2} align="stretch">
              {configs.map((config) => (
                <HStack key={config.id} gap={3}>
                  <Badge colorPalette={getCategoryColor(config.category)} minW="160px">
                    {config.productType}
                  </Badge>
                  <Text color={colors.textColor} fontSize="sm">
                    {config.description || '-'}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default ProductTypeConfigAdmin;
