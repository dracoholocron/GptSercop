/**
 * MenuConfigPanel Component
 * Admin panel for managing dynamic menu items and API endpoints
 * Features: Tree view with drag & drop reordering, search with ancestor preservation
 */
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Table,
  Badge,
  Spinner,
  Alert,
  Input,
  NativeSelect,
  SimpleGrid,
  Stat,
  Tabs,
  Flex,
  IconButton,
  Dialog,
  Field,
  Checkbox,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSync,
  FaSave,
  FaBars,
  FaLink,
  FaShieldAlt,
  FaCode,
  FaFolder,
  FaChevronRight,
  FaChevronDown,
  FaGripVertical,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { notify } from '../ui/toaster';
import {
  getAllMenuItems,
  getAllApiEndpoints,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createApiEndpoint,
  updateApiEndpoint,
  deleteApiEndpoint,
  getApiModules,
  reorderMenuItems,
  type MenuItemDTO,
  type ApiEndpointDTO,
  type CreateMenuItemCommand,
  type UpdateMenuItemCommand,
  type CreateApiEndpointCommand,
  type UpdateApiEndpointCommand,
} from '../../services/menuService';
import { adminService, type Permission } from '../../services/adminService';

// ==================== CONSTANTS ====================

const COLORS = {
  bg: 'white',
  border: 'gray.200',
  headerBg: 'gray.50',
  hoverBg: 'gray.50',
};

// ==================== TYPES ====================

interface FlatTreeItem {
  item: MenuItemDTO;
  depth: number;
  parentId: number | null;
  hasChildren: boolean;
}

interface MenuConfigPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ==================== TREE HELPERS ====================

function buildFlatTree(
  items: MenuItemDTO[],
  expandedItems: Set<number>,
  searchTerm: string
): FlatTreeItem[] {
  // Group by parentId
  const childrenMap = new Map<number | null, MenuItemDTO[]>();
  for (const item of items) {
    const parentId = item.parentId ?? null;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(item);
  }

  // Sort each group by displayOrder
  for (const [, children] of childrenMap) {
    children.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // If searching, find matching items and their ancestors
  let visibleIds: Set<number> | null = null;
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    visibleIds = new Set<number>();
    const itemById = new Map(items.map(i => [i.id, i]));

    for (const item of items) {
      if (
        item.code.toLowerCase().includes(term) ||
        item.labelKey.toLowerCase().includes(term) ||
        (item.path && item.path.toLowerCase().includes(term))
      ) {
        // Add this item and all ancestors
        visibleIds.add(item.id);
        let current = item;
        while (current.parentId != null) {
          visibleIds.add(current.parentId);
          const parent = itemById.get(current.parentId);
          if (!parent) break;
          current = parent;
        }
      }
    }
  }

  const result: FlatTreeItem[] = [];

  function traverse(parentId: number | null, depth: number) {
    const children = childrenMap.get(parentId) || [];
    for (const child of children) {
      if (visibleIds && !visibleIds.has(child.id)) continue;

      const hasChildren = (childrenMap.get(child.id) || []).length > 0;
      result.push({ item: child, depth, parentId, hasChildren });

      // Expand if: explicitly expanded, or searching (show all matching ancestors)
      if (hasChildren && (expandedItems.has(child.id) || visibleIds)) {
        traverse(child.id, depth + 1);
      }
    }
  }

  traverse(null, 0);
  return result;
}

function getSiblings(flatTree: FlatTreeItem[], item: FlatTreeItem): FlatTreeItem[] {
  return flatTree.filter(n => n.parentId === item.parentId && n.depth === item.depth);
}

// ==================== SORTABLE ROW COMPONENT ====================

function SortableTreeRow({
  flatItem,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  t,
}: {
  flatItem: FlatTreeItem;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onEdit: (item: MenuItemDTO) => void;
  onDelete: (item: MenuItemDTO) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { item, depth, hasChildren } = flatItem;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const indent = depth * 32 + 16;

  return (
    <Table.Row
      ref={setNodeRef}
      style={style}
      _hover={{ bg: COLORS.hoverBg }}
      bg={isDragging ? 'blue.50' : undefined}
    >
      {/* Drag handle + expand/collapse + label */}
      <Table.Cell>
        <HStack gap={1} pl={`${indent}px`}>
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            color="gray.400"
            _hover={{ color: 'gray.600' }}
            display="flex"
            alignItems="center"
          >
            <Icon as={FaGripVertical} boxSize={3} />
          </Box>

          {/* Expand/collapse */}
          {hasChildren ? (
            <IconButton
              size="xs"
              variant="ghost"
              onClick={() => onToggleExpand(item.id)}
              aria-label="Toggle"
              minW="20px"
              h="20px"
            >
              <Icon as={isExpanded ? FaChevronDown : FaChevronRight} boxSize={3} />
            </IconButton>
          ) : (
            <Box w="20px" />
          )}

          {/* Section/item indicator */}
          {item.isSection ? (
            <Icon as={FaFolder} color="orange.400" boxSize={3} />
          ) : null}

          {/* Label */}
          <Text
            fontSize="sm"
            fontWeight={item.isSection ? 'semibold' : 'normal'}
            color={item.isSection ? 'orange.700' : undefined}
          >
            {t(item.labelKey)}
          </Text>
        </HStack>
      </Table.Cell>

      {/* Code */}
      <Table.Cell fontFamily="mono" fontSize="xs" color="gray.600">
        {item.code}
      </Table.Cell>

      {/* Path */}
      <Table.Cell fontFamily="mono" fontSize="xs" color="gray.500">
        {item.path || '-'}
      </Table.Cell>

      {/* Permissions */}
      <Table.Cell>
        {item.requiredPermissions?.length > 0 ? (
          <Badge colorPalette="blue" size="sm">{item.requiredPermissions.length}</Badge>
        ) : (
          <Badge colorPalette="gray" size="sm">0</Badge>
        )}
      </Table.Cell>

      {/* APIs */}
      <Table.Cell>
        {item.apiEndpointCodes?.length > 0 ? (
          <Badge colorPalette="green" size="sm">{item.apiEndpointCodes.length}</Badge>
        ) : (
          <Badge colorPalette="gray" size="sm">0</Badge>
        )}
      </Table.Cell>

      {/* Type */}
      <Table.Cell>
        {item.isSection ? (
          <Badge colorPalette="orange" size="sm">{t('admin.menu.section')}</Badge>
        ) : (
          <Badge colorPalette="blue" size="sm" variant="subtle">{t('admin.menu.item')}</Badge>
        )}
      </Table.Cell>

      {/* Actions */}
      <Table.Cell>
        <HStack gap={1}>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="blue"
            onClick={() => onEdit(item)}
            aria-label="Edit"
          >
            <Icon as={FaEdit} />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => onDelete(item)}
            aria-label="Delete"
          >
            <Icon as={FaTrash} />
          </IconButton>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}

// ==================== MAIN COMPONENT ====================

export const MenuConfigPanel: React.FC<MenuConfigPanelProps> = ({
  autoRefresh = false,
  refreshInterval = 30000,
}) => {
  const { t } = useTranslation();

  // State for menu items
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpointDTO[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [apiModules, setApiModules] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('menu');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Dialog state
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItemDTO | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<ApiEndpointDTO | null>(null);

  // Form state for menu item
  const [menuForm, setMenuForm] = useState<CreateMenuItemCommand>({
    code: '',
    labelKey: '',
    icon: '',
    path: '',
    displayOrder: 0,
    isSection: false,
    permissionCodes: [],
    apiEndpointCodes: [],
  });

  // Form state for endpoint
  const [endpointForm, setEndpointForm] = useState<CreateApiEndpointCommand>({
    code: '',
    httpMethod: 'GET',
    urlPattern: '',
    description: '',
    module: '',
    isPublic: false,
    permissionCodes: [],
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Build flat tree
  const flatTree = useMemo(
    () => buildFlatTree(menuItems, expandedItems, searchTerm),
    [menuItems, expandedItems, searchTerm]
  );

  const sortableIds = useMemo(() => flatTree.map(n => n.item.id), [flatTree]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [menuResponse, endpointsResponse, permsResponse, modulesResponse] = await Promise.all([
        getAllMenuItems(),
        getAllApiEndpoints(),
        adminService.getAllPermissions(),
        getApiModules(),
      ]);
      setMenuItems(menuResponse);
      setApiEndpoints(endpointsResponse);
      setPermissions(permsResponse);
      setApiModules(modulesResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Toggle expand menu item
  const toggleExpand = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand/Collapse all
  const expandAll = () => {
    const allIds = new Set(menuItems.map(i => i.id));
    setExpandedItems(allIds);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  // Filter endpoints
  const filteredEndpoints = apiEndpoints.filter(ep =>
    ep.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.urlPattern.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle drag end - reorder within same level
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeNode = flatTree.find(n => n.item.id === active.id);
    const overNode = flatTree.find(n => n.item.id === over.id);
    if (!activeNode || !overNode) return;

    // Only allow reorder within same parent
    if (activeNode.parentId !== overNode.parentId) return;

    const siblings = getSiblings(flatTree, activeNode);
    const oldIndex = siblings.findIndex(n => n.item.id === active.id);
    const newIndex = siblings.findIndex(n => n.item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder siblings
    const reordered = [...siblings];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Build reorder command
    const reorderItems = reordered.map((n, idx) => ({
      id: n.item.id,
      parentId: n.parentId,
      displayOrder: idx,
    }));

    // Optimistic update
    const updatedMenuItems = menuItems.map(mi => {
      const reorderItem = reorderItems.find(r => r.id === mi.id);
      if (reorderItem) {
        return { ...mi, displayOrder: reorderItem.displayOrder };
      }
      return mi;
    });
    setMenuItems(updatedMenuItems);

    try {
      await reorderMenuItems({ items: reorderItems });
      notify.success(t('admin.menu.reordered'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder';
      notify.error(message);
      fetchData(); // revert on failure
    }
  };

  // Open menu dialog for create
  const handleCreateMenu = () => {
    setEditingMenuItem(null);
    setMenuForm({
      code: '',
      labelKey: '',
      icon: 'FiFile',
      path: '',
      displayOrder: menuItems.length,
      isSection: false,
      permissionCodes: [],
      apiEndpointCodes: [],
    });
    setShowMenuDialog(true);
  };

  // Open menu dialog for edit
  const handleEditMenu = (item: MenuItemDTO) => {
    setEditingMenuItem(item);
    setMenuForm({
      code: item.code,
      parentId: item.parentId || undefined,
      labelKey: item.labelKey,
      icon: item.icon || '',
      path: item.path || '',
      displayOrder: item.displayOrder,
      isSection: item.isSection,
      permissionCodes: item.requiredPermissions || [],
      apiEndpointCodes: item.apiEndpointCodes || [],
    });
    setShowMenuDialog(true);
  };

  // Save menu item
  const handleSaveMenu = async () => {
    try {
      setSaving(true);
      if (editingMenuItem) {
        const command: UpdateMenuItemCommand = {
          ...menuForm,
          isActive: true,
        };
        await updateMenuItem(editingMenuItem.id, command);
        notify.success(t('admin.menu.updated'));
      } else {
        await createMenuItem(menuForm);
        notify.success(t('admin.menu.created'));
      }
      setShowMenuDialog(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete menu item
  const handleDeleteMenu = async (item: MenuItemDTO) => {
    if (!confirm(t('admin.menu.confirmDelete', { name: item.code }))) return;
    try {
      await deleteMenuItem(item.id);
      notify.success(t('admin.menu.deleted'));
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      notify.error(message);
    }
  };

  // Open endpoint dialog for create
  const handleCreateEndpoint = () => {
    setEditingEndpoint(null);
    setEndpointForm({
      code: '',
      httpMethod: 'GET',
      urlPattern: '',
      description: '',
      module: '',
      isPublic: false,
      permissionCodes: [],
    });
    setShowEndpointDialog(true);
  };

  // Open endpoint dialog for edit
  const handleEditEndpoint = (ep: ApiEndpointDTO) => {
    setEditingEndpoint(ep);
    setEndpointForm({
      code: ep.code,
      httpMethod: ep.httpMethod,
      urlPattern: ep.urlPattern,
      description: ep.description || '',
      module: ep.module || '',
      isPublic: ep.isPublic,
      permissionCodes: ep.requiredPermissions || [],
    });
    setShowEndpointDialog(true);
  };

  // Save endpoint
  const handleSaveEndpoint = async () => {
    try {
      setSaving(true);
      if (editingEndpoint) {
        const command: UpdateApiEndpointCommand = {
          ...endpointForm,
          isActive: true,
        };
        await updateApiEndpoint(editingEndpoint.id, command);
        notify.success(t('admin.endpoint.updated'));
      } else {
        await createApiEndpoint(endpointForm);
        notify.success(t('admin.endpoint.created'));
      }
      setShowEndpointDialog(false);
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      notify.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (ep: ApiEndpointDTO) => {
    if (!confirm(t('admin.endpoint.confirmDelete', { name: ep.code }))) return;
    try {
      await deleteApiEndpoint(ep.id);
      notify.success(t('admin.endpoint.deleted'));
      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      notify.error(message);
    }
  };

  // Stats
  const totalMenuItems = menuItems.length;
  const totalEndpoints = apiEndpoints.length;
  const publicEndpoints = apiEndpoints.filter(ep => ep.isPublic).length;
  const protectedEndpoints = totalEndpoints - publicEndpoints;

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>{t('common.loading')}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box bg={COLORS.headerBg} p={6} borderBottom="1px" borderColor={COLORS.border}>
        <HStack justify="space-between" align="center">
          <HStack gap={3}>
            <Icon as={FaBars} boxSize={6} color="blue.500" />
            <Box>
              <Text fontSize="2xl" fontWeight="bold">{t('admin.menu.title')}</Text>
              <Text fontSize="sm" color="gray.500">{t('admin.menu.subtitle')}</Text>
            </Box>
          </HStack>
          <HStack gap={2}>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <Icon as={FaSync} mr={2} />
              {t('common.refresh')}
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} p={6}>
        <Stat.Root>
          <Stat.Label>{t('admin.menu.totalMenuItems')}</Stat.Label>
          <Stat.ValueText>
            <HStack>
              <Icon as={FaBars} color="blue.500" />
              <Text>{totalMenuItems}</Text>
            </HStack>
          </Stat.ValueText>
        </Stat.Root>
        <Stat.Root>
          <Stat.Label>{t('admin.menu.totalEndpoints')}</Stat.Label>
          <Stat.ValueText>
            <HStack>
              <Icon as={FaCode} color="green.500" />
              <Text>{totalEndpoints}</Text>
            </HStack>
          </Stat.ValueText>
        </Stat.Root>
        <Stat.Root>
          <Stat.Label>{t('admin.menu.protectedEndpoints')}</Stat.Label>
          <Stat.ValueText>
            <HStack>
              <Icon as={FaShieldAlt} color="orange.500" />
              <Text>{protectedEndpoints}</Text>
            </HStack>
          </Stat.ValueText>
        </Stat.Root>
        <Stat.Root>
          <Stat.Label>{t('admin.menu.publicEndpoints')}</Stat.Label>
          <Stat.ValueText>
            <HStack>
              <Icon as={FaLink} color="purple.500" />
              <Text>{publicEndpoints}</Text>
            </HStack>
          </Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>

      {/* Error alert */}
      {error && (
        <Box px={6}>
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        </Box>
      )}

      {/* Tabs */}
      <Box px={6} pb={6}>
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
          <Tabs.List>
            <Tabs.Trigger value="menu">
              <Icon as={FaBars} mr={2} />
              {t('admin.menu.menuItems')}
            </Tabs.Trigger>
            <Tabs.Trigger value="endpoints">
              <Icon as={FaCode} mr={2} />
              {t('admin.menu.apiEndpoints')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Menu Items Tab */}
          <Tabs.Content value="menu">
            <VStack align="stretch" gap={4} pt={4}>
              {/* Search and actions */}
              <HStack justify="space-between">
                <HStack flex={1} maxW="400px">
                  <Input
                    placeholder={t('admin.menu.searchMenuItems')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon as={FaSearch} color="gray.400" />
                </HStack>
                <HStack gap={2}>
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    <Icon as={FaExpandArrowsAlt} mr={1} />
                    {t('admin.menu.expandAll')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    <Icon as={FaCompressArrowsAlt} mr={1} />
                    {t('admin.menu.collapseAll')}
                  </Button>
                  <Button colorPalette="blue" size="sm" onClick={handleCreateMenu}>
                    <Icon as={FaPlus} mr={2} />
                    {t('admin.menu.addMenuItem')}
                  </Button>
                </HStack>
              </HStack>

              {/* Menu items tree table */}
              <Box border="1px" borderColor={COLORS.border} borderRadius="lg" overflow="hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row bg={COLORS.headerBg}>
                        <Table.ColumnHeader minW="300px">{t('admin.menu.labelKey')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="150px">{t('admin.menu.code')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="180px">{t('admin.menu.path')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="80px">{t('admin.menu.permissions')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="60px">{t('admin.menu.apis')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="80px">{t('admin.menu.type')}</Table.ColumnHeader>
                        <Table.ColumnHeader w="80px">{t('common.actions')}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        {flatTree.length === 0 ? (
                          <Table.Row>
                            <Table.Cell colSpan={7}>
                              <Text textAlign="center" py={8} color="gray.400">
                                {t('admin.menu.noItems')}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        ) : (
                          flatTree.map((flatItem) => (
                            <SortableTreeRow
                              key={flatItem.item.id}
                              flatItem={flatItem}
                              isExpanded={expandedItems.has(flatItem.item.id)}
                              onToggleExpand={toggleExpand}
                              onEdit={handleEditMenu}
                              onDelete={handleDeleteMenu}
                              t={t}
                            />
                          ))
                        )}
                      </SortableContext>
                    </Table.Body>
                  </Table.Root>
                </DndContext>
              </Box>
            </VStack>
          </Tabs.Content>

          {/* API Endpoints Tab */}
          <Tabs.Content value="endpoints">
            <VStack align="stretch" gap={4} pt={4}>
              {/* Search and actions */}
              <HStack justify="space-between">
                <HStack flex={1} maxW="400px">
                  <Input
                    placeholder={t('admin.endpoint.searchEndpoints')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Icon as={FaSearch} color="gray.400" />
                </HStack>
                <Button colorPalette="green" onClick={handleCreateEndpoint}>
                  <Icon as={FaPlus} mr={2} />
                  {t('admin.endpoint.addEndpoint')}
                </Button>
              </HStack>

              {/* Endpoints table */}
              <Box border="1px" borderColor={COLORS.border} borderRadius="lg" overflow="hidden">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg={COLORS.headerBg}>
                      <Table.ColumnHeader w="80px">{t('admin.endpoint.method')}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t('admin.endpoint.urlPattern')}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t('admin.endpoint.code')}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t('admin.endpoint.module')}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t('admin.endpoint.public')}</Table.ColumnHeader>
                      <Table.ColumnHeader>{t('admin.menu.permissions')}</Table.ColumnHeader>
                      <Table.ColumnHeader w="100px">{t('common.actions')}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredEndpoints.map((ep) => (
                      <Table.Row key={ep.id} _hover={{ bg: COLORS.hoverBg }}>
                        <Table.Cell>
                          <Badge colorPalette={
                            ep.httpMethod === 'GET' ? 'blue' :
                            ep.httpMethod === 'POST' ? 'green' :
                            ep.httpMethod === 'PUT' ? 'orange' :
                            ep.httpMethod === 'DELETE' ? 'red' : 'gray'
                          }>
                            {ep.httpMethod}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell fontFamily="mono" fontSize="sm">{ep.urlPattern}</Table.Cell>
                        <Table.Cell fontFamily="mono" fontSize="sm">{ep.code}</Table.Cell>
                        <Table.Cell>{ep.module || '-'}</Table.Cell>
                        <Table.Cell>
                          {ep.isPublic ? (
                            <Badge colorPalette="green">{t('common.yes')}</Badge>
                          ) : (
                            <Badge colorPalette="gray">{t('common.no')}</Badge>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {ep.requiredPermissions?.length > 0 ? (
                            <Badge colorPalette="blue">{ep.requiredPermissions.length}</Badge>
                          ) : (
                            <Badge colorPalette="gray">{t('common.none')}</Badge>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={1}>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="blue"
                              onClick={() => handleEditEndpoint(ep)}
                              aria-label="Edit"
                            >
                              <Icon as={FaEdit} />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleDeleteEndpoint(ep)}
                              aria-label="Delete"
                            >
                              <Icon as={FaTrash} />
                            </IconButton>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      {/* Menu Item Dialog */}
      <Dialog.Root open={showMenuDialog} onOpenChange={(e) => setShowMenuDialog(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>
                {editingMenuItem ? t('admin.menu.editMenuItem') : t('admin.menu.addMenuItem')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <SimpleGrid columns={2} gap={4} w="100%">
                  <Field.Root>
                    <Field.Label>{t('admin.menu.code')}</Field.Label>
                    <Input
                      value={menuForm.code}
                      onChange={(e) => setMenuForm({ ...menuForm, code: e.target.value })}
                      placeholder="DASHBOARD"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('admin.menu.labelKey')}</Field.Label>
                    <Input
                      value={menuForm.labelKey}
                      onChange={(e) => setMenuForm({ ...menuForm, labelKey: e.target.value })}
                      placeholder="menu.dashboard"
                    />
                  </Field.Root>
                </SimpleGrid>
                <SimpleGrid columns={2} gap={4} w="100%">
                  <Field.Root>
                    <Field.Label>{t('admin.menu.icon')}</Field.Label>
                    <Input
                      value={menuForm.icon}
                      onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                      placeholder="FiHome"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('admin.menu.path')}</Field.Label>
                    <Input
                      value={menuForm.path}
                      onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
                      placeholder="/dashboard"
                    />
                  </Field.Root>
                </SimpleGrid>
                <SimpleGrid columns={2} gap={4} w="100%">
                  <Field.Root>
                    <Field.Label>{t('admin.menu.displayOrder')}</Field.Label>
                    <Input
                      type="number"
                      value={menuForm.displayOrder}
                      onChange={(e) => setMenuForm({ ...menuForm, displayOrder: parseInt(e.target.value) || 0 })}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('admin.menu.parent')}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={menuForm.parentId || ''}
                        onChange={(e) => setMenuForm({ ...menuForm, parentId: e.target.value ? parseInt(e.target.value) : undefined })}
                      >
                        <option value="">{t('common.none')}</option>
                        {menuItems.filter(m => m.id !== editingMenuItem?.id).map(m => (
                          <option key={m.id} value={m.id}>{m.code} - {t(m.labelKey)}</option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>
                </SimpleGrid>
                <Field.Root>
                  <Checkbox.Root
                    checked={menuForm.isSection}
                    onCheckedChange={(e) => setMenuForm({ ...menuForm, isSection: !!e.checked })}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{t('admin.menu.isSection')}</Checkbox.Label>
                  </Checkbox.Root>
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowMenuDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button colorPalette="blue" onClick={handleSaveMenu} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Icon as={FaSave} mr={2} />}
                {t('common.save')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Endpoint Dialog */}
      <Dialog.Root open={showEndpointDialog} onOpenChange={(e) => setShowEndpointDialog(e.open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>
                {editingEndpoint ? t('admin.endpoint.editEndpoint') : t('admin.endpoint.addEndpoint')}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <SimpleGrid columns={2} gap={4} w="100%">
                  <Field.Root>
                    <Field.Label>{t('admin.endpoint.code')}</Field.Label>
                    <Input
                      value={endpointForm.code}
                      onChange={(e) => setEndpointForm({ ...endpointForm, code: e.target.value })}
                      placeholder="GET_DASHBOARD"
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('admin.endpoint.method')}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={endpointForm.httpMethod}
                        onChange={(e) => setEndpointForm({ ...endpointForm, httpMethod: e.target.value })}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Field.Root>
                </SimpleGrid>
                <Field.Root>
                  <Field.Label>{t('admin.endpoint.urlPattern')}</Field.Label>
                  <Input
                    value={endpointForm.urlPattern}
                    onChange={(e) => setEndpointForm({ ...endpointForm, urlPattern: e.target.value })}
                    placeholder="/api/dashboard/**"
                  />
                </Field.Root>
                <SimpleGrid columns={2} gap={4} w="100%">
                  <Field.Root>
                    <Field.Label>{t('admin.endpoint.module')}</Field.Label>
                    <Input
                      value={endpointForm.module}
                      onChange={(e) => setEndpointForm({ ...endpointForm, module: e.target.value })}
                      placeholder="DASHBOARD"
                      list="modules"
                    />
                    <datalist id="modules">
                      {apiModules.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{t('admin.endpoint.description')}</Field.Label>
                    <Input
                      value={endpointForm.description}
                      onChange={(e) => setEndpointForm({ ...endpointForm, description: e.target.value })}
                      placeholder="Get dashboard data"
                    />
                  </Field.Root>
                </SimpleGrid>
                <Field.Root>
                  <Checkbox.Root
                    checked={endpointForm.isPublic}
                    onCheckedChange={(e) => setEndpointForm({ ...endpointForm, isPublic: !!e.checked })}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{t('admin.endpoint.isPublic')}</Checkbox.Label>
                  </Checkbox.Root>
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowEndpointDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button colorPalette="green" onClick={handleSaveEndpoint} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <Icon as={FaSave} mr={2} />}
                {t('common.save')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default MenuConfigPanel;
