import { Box, Badge, IconButton } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../config/api.client';
import { ALERT_ROUTES, buildUrlWithParams } from '../../config/api.routes';

interface TodayAlertsWidgetResponse {
  totalToday: number;
  pendingToday: number;
  completedToday: number;
  overdueTotal: number;
  hasUrgent: boolean;
  urgentCount: number;
  topAlerts: unknown[];
}

interface AlertsWidgetProps {
  refreshInterval?: number;
}

export const AlertsWidget = ({ refreshInterval = 60000 }: AlertsWidgetProps) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  const [widget, setWidget] = useState<TodayAlertsWidgetResponse | null>(null);

  const loadWidget = useCallback(async () => {
    try {
      const url = buildUrlWithParams(ALERT_ROUTES.WIDGET, { lang: 'es' });
      const response = await apiClient.get<TodayAlertsWidgetResponse>(url);
      setWidget(response.data);
    } catch (error) {
      console.error('Error loading alerts widget:', error);
    }
  }, []);

  useEffect(() => {
    loadWidget();
    const interval = setInterval(loadWidget, refreshInterval);
    return () => clearInterval(interval);
  }, [loadWidget, refreshInterval]);

  const handleClick = () => {
    navigate('/alerts');
  };

  const totalBadge = (widget?.pendingToday || 0) + (widget?.overdueTotal || 0);
  const hasUrgent = widget?.hasUrgent || false;

  return (
    <Box position="relative">
      <IconButton
        aria-label="Alerts"
        variant="ghost"
        color={hasUrgent ? 'red.500' : colors.textColor}
        onClick={handleClick}
        _hover={{ bg: colors.activeBg }}
        size="md"
      >
        <FiBell size={20} />
      </IconButton>
      {totalBadge > 0 && (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          bg="red.500"
          color="white"
          borderRadius="full"
          fontSize="10px"
          fontWeight="bold"
          minW="18px"
          h="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
          border="2px solid"
          borderColor={colors.cardBg}
        >
          {totalBadge > 99 ? '99+' : totalBadge}
        </Box>
      )}
    </Box>
  );
};

export default AlertsWidget;
