/**
 * useQuickActions - Hook para accesos rápidos configurables por usuario
 *
 * - Carga items del menú del usuario via menuService
 * - Permite al usuario seleccionar favoritos (max 6)
 * - Persiste en localStorage por username
 * - Provee defaults inteligentes si no hay favoritos guardados
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { menuService } from '../services/menuService';
import type { MenuItemDTO } from '../services/menuService';

export interface QuickAction {
  id: number;
  code: string;
  labelKey: string;
  icon: string | null;
  path: string;
}

const STORAGE_KEY_PREFIX = 'globalcmx-quick-actions-';
const MAX_FAVORITES = 6;

// Default quick action codes if user has no favorites saved
const DEFAULT_CODES = [
  'lc-import-issuance',
  'guarantees-issuance',
  'workbox.drafts',
  'swift-message-center',
];

function flattenMenuItems(items: MenuItemDTO[]): MenuItemDTO[] {
  const result: MenuItemDTO[] = [];
  for (const item of items) {
    if (item.path && !item.isSection) {
      result.push(item);
    }
    if (item.children?.length) {
      result.push(...flattenMenuItems(item.children));
    }
  }
  return result;
}

function getStorageKey(username: string): string {
  return `${STORAGE_KEY_PREFIX}${username}`;
}

export function useQuickActions() {
  const { user } = useAuth();
  const [allActions, setAllActions] = useState<QuickAction[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load menu items and saved favorites
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const menuItems = await menuService.getUserMenu();
        const flat = flattenMenuItems(menuItems);
        const actions: QuickAction[] = flat.map(item => ({
          id: item.id,
          code: item.code,
          labelKey: item.labelKey,
          icon: item.icon,
          path: item.path!,
        }));
        setAllActions(actions);

        // Load saved favorites
        const key = getStorageKey(user?.username || 'default');
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const ids = JSON.parse(saved) as number[];
            // Filter to only valid IDs
            const validIds = ids.filter(id => actions.some(a => a.id === id));
            setFavoriteIds(validIds);
          } catch {
            setFavoriteIds([]);
          }
        } else {
          // Auto-select defaults based on code matching
          const defaultIds = actions
            .filter(a => DEFAULT_CODES.some(code => a.code.includes(code) || a.path.includes(code)))
            .slice(0, 4)
            .map(a => a.id);
          setFavoriteIds(defaultIds);
        }
      } catch {
        setAllActions([]);
        setFavoriteIds([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.username]);

  // Get the actual favorite QuickAction objects
  const favorites: QuickAction[] = favoriteIds
    .map(id => allActions.find(a => a.id === id))
    .filter((a): a is QuickAction => !!a);

  // Toggle a favorite
  const toggleFavorite = useCallback((actionId: number) => {
    setFavoriteIds(prev => {
      let next: number[];
      if (prev.includes(actionId)) {
        next = prev.filter(id => id !== actionId);
      } else {
        if (prev.length >= MAX_FAVORITES) return prev;
        next = [...prev, actionId];
      }
      // Persist
      const key = getStorageKey(user?.username || 'default');
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [user?.username]);

  // Check if an action is a favorite
  const isFavorite = useCallback((actionId: number) => {
    return favoriteIds.includes(actionId);
  }, [favoriteIds]);

  return {
    favorites,
    allActions,
    toggleFavorite,
    isFavorite,
    isLoading,
    maxFavorites: MAX_FAVORITES,
  };
}
