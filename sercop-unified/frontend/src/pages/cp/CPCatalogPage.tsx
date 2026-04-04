/**
 * CPCatalogPage - Catálogo Electrónico de Compras Públicas
 * Grid de catálogos → items → carrito lateral → checkout con OC
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Input,
  Card,
  Table,
  Separator,
} from '@chakra-ui/react';
import {
  FiShoppingCart,
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiCheckCircle,
  FiPackage,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../../components/ui/toaster';
import { get, post } from '../../utils/apiClient';

// ============================================================================
// Types
// ============================================================================

interface Catalog {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  provider?: { name: string } | null;
  items?: CatalogItem[];
}

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  unit: string | null;
  available: boolean;
  cpcCode: string | null;
}

interface CartItem {
  catalogItemId: string;
  name: string;
  unitPrice: number;
  unit: string | null;
  quantity: number;
}

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (v: number) =>
  `$${Number(v).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

// ============================================================================
// Main Component
// ============================================================================

export const CPCatalogPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';

  const cartTotal = cartItems.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  const cartCount = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/v1/catalogs?page=1&pageSize=50');
      if (res.ok) {
        const d = await res.json();
        setCatalogs(Array.isArray(d?.data) ? d.data : []);
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (item: CatalogItem, catalogName: string) => {
    setCartItems(prev => {
      const existing = prev.find(ci => ci.catalogItemId === item.id);
      if (existing) {
        return prev.map(ci => ci.catalogItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { catalogItemId: item.id, name: item.name, unitPrice: item.unitPrice, unit: item.unit, quantity: 1 }];
    });
    toaster.create({ title: `${item.name} agregado al carrito`, type: 'success' });
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => prev
      .map(ci => ci.catalogItemId === id ? { ...ci, quantity: ci.quantity + delta } : ci)
      .filter(ci => ci.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(ci => ci.catalogItemId !== id));

  const checkout = async () => {
    if (cartItems.length === 0) return;
    setCheckingOut(true);
    try {
      // Initialize or get cart
      const initRes = await post('/v1/catalogs/cart', { items: cartItems });
      if (!initRes.ok) throw new Error('Cart init failed');
      const { cartId } = await initRes.json();

      // Checkout
      const checkRes = await post('/v1/catalogs/checkout', {
        cartId,
        deliveryAddress: 'Dirección registrada en sistema',
        notes: 'Orden generada desde Catálogo Electrónico',
      });
      if (!checkRes.ok) throw new Error('Checkout failed');
      const result = await checkRes.json();
      setOrderNumber(result?.orderNumber || `OC-${Date.now()}`);
      setCartItems([]);
      setShowCart(false);
      toaster.create({ title: '¡Orden de compra generada exitosamente!', type: 'success' });
    } catch {
      toaster.create({ title: t('common.error', 'Error al procesar la orden'), type: 'error' });
    } finally {
      setCheckingOut(false);
    }
  };

  const filtered = searchText.trim()
    ? catalogs.filter(c =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchText.toLowerCase())
      )
    : catalogs;

  return (
    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack gap={5} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <HStack gap={3}>
            <Icon as={FiShoppingCart} boxSize={6} color={isDark ? 'cyan.300' : 'cyan.500'} />
            <VStack align="start" gap={0}>
              <Heading size="md">{t('cp.catalog.title', 'Catálogo Electrónico')}</Heading>
              <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>
                Adquisición de bienes y servicios del catálogo oficial
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={load}>
              <Icon as={FiRefreshCw} mr={2} />
              {t('common.refresh', 'Actualizar')}
            </Button>
            <Button
              size="sm"
              colorPalette="cyan"
              position="relative"
              onClick={() => setShowCart(v => !v)}
            >
              <Icon as={FiShoppingCart} mr={2} />
              Carrito
              {cartCount > 0 && (
                <Badge
                  colorPalette="red"
                  variant="solid"
                  borderRadius="full"
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  fontSize="xs"
                  minW={4}
                  h={4}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </HStack>
        </Flex>

        {/* Success message */}
        {orderNumber && (
          <Box bg={isDark ? 'green.900' : 'green.50'} borderRadius="xl" p={5} textAlign="center" borderWidth="2px" borderColor={isDark ? 'green.600' : 'green.200'}>
            <Icon as={FiCheckCircle} boxSize={10} color={isDark ? 'green.400' : 'green.500'} mb={2} />
            <Heading size="md" color={isDark ? 'green.300' : 'green.600'}>¡Orden de Compra Generada!</Heading>
            <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'} mt={1}>
              Número de orden: <Text as="strong" fontFamily="mono">{orderNumber}</Text>
            </Text>
            <Button mt={3} size="sm" colorPalette="green" variant="outline" onClick={() => setOrderNumber(null)}>
              Continuar comprando
            </Button>
          </Box>
        )}

        <Flex gap={5} align="flex-start" flexWrap={{ base: 'wrap', xl: 'nowrap' }}>
          {/* Main content */}
          <Box flex={1} minW={0}>
            {/* Search */}
            <HStack bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} px={3} py={2} mb={4}>
              <Icon as={FiSearch} color={isDark ? 'gray.400' : 'gray.500'} boxSize={4} />
              <Input
                variant="unstyled"
                placeholder="Buscar catálogos por nombre o categoría..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                fontSize="sm"
              />
            </HStack>

            {/* Back to catalogs */}
            {selectedCatalog && (
              <HStack mb={4}>
                <Button size="sm" variant="ghost" onClick={() => setSelectedCatalog(null)}>
                  ← Volver a catálogos
                </Button>
                <Separator orientation="vertical" h={4} />
                <Text fontWeight="600" fontSize="sm">{selectedCatalog.name}</Text>
              </HStack>
            )}

            {loading ? (
              <Flex justify="center" py={16}><Spinner size="lg" /></Flex>
            ) : !selectedCatalog ? (
              // Catalogs grid
              filtered.length === 0 ? (
                <Box textAlign="center" py={16}>
                  <Icon as={FiPackage} boxSize={10} color="gray.400" mb={3} />
                  <Text color={isDark ? 'gray.400' : 'gray.500'}>No se encontraron catálogos</Text>
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={4}
                >
                  {filtered.map(c => (
                    <Box
                      key={c.id}
                      bg={cardBg}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      p={4}
                      cursor="pointer"
                      _hover={{ borderColor: 'cyan.400', boxShadow: isDark ? '0 0 0 1px var(--chakra-colors-cyan-700)' : '0 0 0 1px var(--chakra-colors-cyan-200)' }}
                      onClick={() => setSelectedCatalog(c)}
                      transition="all 0.15s"
                    >
                      <VStack align="start" gap={2}>
                        <HStack justify="space-between" w="full">
                          <Icon as={FiPackage} boxSize={5} color={isDark ? 'cyan.300' : 'cyan.500'} />
                          {c.category && (
                            <Badge colorPalette="cyan" variant="subtle" fontSize="xs">{c.category}</Badge>
                          )}
                        </HStack>
                        <Text fontWeight="700" fontSize="sm" noOfLines={2}>{c.name}</Text>
                        {c.description && (
                          <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} noOfLines={2}>{c.description}</Text>
                        )}
                        {c.provider && (
                          <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.400'}>{c.provider.name}</Text>
                        )}
                        <HStack justify="flex-end" w="full" mt={1}>
                          <Button size="xs" colorPalette="cyan" variant="ghost">
                            Ver productos <Icon as={FiArrowRight} ml={1} boxSize={3} />
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
                </Box>
              )
            ) : (
              // Items in selected catalog
              <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
                {!selectedCatalog.items || selectedCatalog.items.length === 0 ? (
                  <Box textAlign="center" py={12}>
                    <Icon as={FiPackage} boxSize={8} color="gray.400" mb={2} />
                    <Text color={isDark ? 'gray.400' : 'gray.500'} fontSize="sm">
                      No hay productos disponibles en este catálogo
                    </Text>
                  </Box>
                ) : (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Producto</Table.ColumnHeader>
                        <Table.ColumnHeader>CPC</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">Precio Unit.</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Unidad</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Disponible</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="center">Acción</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {selectedCatalog.items.map(item => (
                        <Table.Row key={item.id}>
                          <Table.Cell>
                            <VStack align="start" gap={0}>
                              <Text fontSize="sm" fontWeight="600">{item.name}</Text>
                              {item.description && <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'} noOfLines={1}>{item.description}</Text>}
                            </VStack>
                          </Table.Cell>
                          <Table.Cell>
                            {item.cpcCode && <Badge colorPalette="purple" variant="subtle" fontSize="xs" fontFamily="mono">{item.cpcCode}</Badge>}
                          </Table.Cell>
                          <Table.Cell textAlign="right" fontWeight="500">{formatCurrency(item.unitPrice)}</Table.Cell>
                          <Table.Cell textAlign="center">{item.unit || '—'}</Table.Cell>
                          <Table.Cell textAlign="center">
                            {item.available ? (
                              <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
                            ) : (
                              <Badge colorPalette="gray" variant="subtle" fontSize="xs">Agotado</Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <Button
                              size="xs"
                              colorPalette="cyan"
                              disabled={!item.available}
                              onClick={() => addToCart(item, selectedCatalog.name)}
                            >
                              <Icon as={FiPlus} mr={1} />
                              Agregar
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                )}
              </Box>
            )}
          </Box>

          {/* Cart panel */}
          {showCart && (
            <Box
              w={{ base: 'full', xl: '320px' }}
              flexShrink={0}
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
            >
              <HStack px={4} py={3} borderBottomWidth="1px" borderColor={borderColor} justify="space-between">
                <HStack gap={2}>
                  <Icon as={FiShoppingCart} color={isDark ? 'cyan.300' : 'cyan.500'} boxSize={4} />
                  <Text fontWeight="700" fontSize="sm">
                    Carrito
                    {cartCount > 0 && <Badge ml={2} colorPalette="cyan" variant="solid" fontSize="xs">{cartCount}</Badge>}
                  </Text>
                </HStack>
                <Button size="xs" variant="ghost" onClick={() => setShowCart(false)}>×</Button>
              </HStack>

              {cartItems.length === 0 ? (
                <Box textAlign="center" py={10} px={4}>
                  <Icon as={FiShoppingCart} boxSize={8} color="gray.400" mb={2} />
                  <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.500'}>El carrito está vacío</Text>
                </Box>
              ) : (
                <>
                  <VStack gap={0} align="stretch" maxH="400px" overflowY="auto">
                    {cartItems.map(ci => (
                      <Box key={ci.catalogItemId} px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm" fontWeight="600" noOfLines={1}>{ci.name}</Text>
                          <Button size="xs" variant="ghost" colorPalette="red" onClick={() => removeFromCart(ci.catalogItemId)}>
                            <Icon as={FiTrash2} boxSize={3} />
                          </Button>
                        </HStack>
                        <HStack justify="space-between">
                          <HStack gap={1}>
                            <Button size="xs" variant="outline" onClick={() => updateQty(ci.catalogItemId, -1)}>
                              <Icon as={FiMinus} boxSize={3} />
                            </Button>
                            <Text fontSize="sm" fontWeight="600" minW={6} textAlign="center">{ci.quantity}</Text>
                            <Button size="xs" variant="outline" onClick={() => updateQty(ci.catalogItemId, 1)}>
                              <Icon as={FiPlus} boxSize={3} />
                            </Button>
                          </HStack>
                          <Text fontSize="sm" fontWeight="700">{formatCurrency(ci.unitPrice * ci.quantity)}</Text>
                        </HStack>
                        <Text fontSize="xs" color={isDark ? 'gray.400' : 'gray.500'}>{formatCurrency(ci.unitPrice)} / {ci.unit || 'u'}</Text>
                      </Box>
                    ))}
                  </VStack>

                  <Box px={4} py={4}>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="700">Total</Text>
                      <Text fontWeight="700" fontSize="lg" color={isDark ? 'cyan.300' : 'cyan.600'}>
                        {formatCurrency(cartTotal)}
                      </Text>
                    </HStack>
                    <Button
                      colorPalette="cyan"
                      w="full"
                      onClick={checkout}
                      loading={checkingOut}
                    >
                      <Icon as={FiCheckCircle} mr={2} />
                      Generar Orden de Compra
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default CPCatalogPage;
