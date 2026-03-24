import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  VStack,
  Text,
  Spinner,
  Icon,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { LuShield, LuKey } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import type { ProviderInfo } from '../../services/authService';

interface IdentityProviderSelectorProps {
  onLocalAuthSelected?: () => void;
  onSsoProviderSelected?: (provider: ProviderInfo) => void;
  isLoading?: boolean;
  hideLocalAuth?: boolean;
  returnUrl?: string;
}

export const IdentityProviderSelector: React.FC<IdentityProviderSelectorProps> = ({
  onLocalAuthSelected,
  onSsoProviderSelected,
  isLoading = false,
  hideLocalAuth = false,
  returnUrl,
}) => {
  const { t } = useTranslation();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const providerList = await authService.getEnabledProviders();
        setProviders(providerList);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Error loading providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderClick = async (provider: ProviderInfo) => {
    if (provider.id === 'LOCAL') {
      onLocalAuthSelected?.();
      return;
    }

    try {
      onSsoProviderSelected?.(provider);
      const authUrl = await authService.initiateOAuth2(provider.id, returnUrl);
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('SSO initiation failed:', err);
      setError(t('auth.ssoInitFailed'));
    }
  };

  const getProviderIcon = (provider: ProviderInfo) => {
    switch (provider.icon) {
      case 'shield':
        return LuShield;
      case 'key':
      default:
        return LuKey;
    }
  };

  const getProviderColors = (providerId: string) => {
    switch (providerId) {
      case 'AUTH0':
        return { bg: '#eb5424', hoverBg: '#d44920', color: 'white' };
      case 'AZURE_AD':
        return { bg: '#00a4ef', hoverBg: '#0088cc', color: 'white' };
      case 'GOOGLE':
        return {
          bg: darkMode ? 'gray.700' : 'white',
          hoverBg: darkMode ? 'gray.600' : 'gray.50',
          color: darkMode ? 'white' : 'gray.700',
          border: '1px solid'
        };
      case 'COGNITO':
        return { bg: '#ff9900', hoverBg: '#e68a00', color: 'white' };
      case 'LOCAL':
      default:
        return {
          bg: darkMode ? 'gray.700' : 'gray.600',
          hoverBg: darkMode ? 'gray.600' : 'gray.500',
          color: 'white'
        };
    }
  };

  // Dark mode aware colors
  const dividerColor = darkMode ? 'gray.600' : 'gray.300';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4} color="red.500">
        {error}
      </Box>
    );
  }

  const ssoProviders = providers.filter(p => p.id !== 'LOCAL');
  const localProvider = providers.find(p => p.id === 'LOCAL');

  return (
    <VStack gap={4} w="100%">
      {/* SSO Providers */}
      {ssoProviders.length > 0 && (
        <VStack gap={3} w="100%">
          <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
            {t('auth.signInWith')}
          </Text>
          {ssoProviders.map((provider) => {
            const providerColors = getProviderColors(provider.id);
            return (
              <Button
                key={provider.id}
                onClick={() => handleProviderClick(provider)}
                disabled={isLoading}
                w="100%"
                size="lg"
                bg={providerColors.bg}
                color={providerColors.color}
                borderColor={providerColors.border ? dividerColor : undefined}
                border={providerColors.border}
                _hover={{ bg: providerColors.hoverBg, transform: 'translateY(-1px)' }}
                transition="all 0.2s"
              >
                <HStack gap={3}>
                  <Icon as={getProviderIcon(provider)} boxSize={5} />
                  <Text>{provider.name}</Text>
                  {provider.isDefault && (
                    <Badge colorScheme="green" fontSize="xs">
                      {t('auth.recommended')}
                    </Badge>
                  )}
                </HStack>
              </Button>
            );
          })}
        </VStack>
      )}

      {/* Divider */}
      {ssoProviders.length > 0 && localProvider && !hideLocalAuth && (
        <HStack w="100%" gap={4}>
          <Box flex={1} h="1px" bg={dividerColor} />
          <Text fontSize="sm" color={colors.textColorSecondary}>{t('auth.or')}</Text>
          <Box flex={1} h="1px" bg={dividerColor} />
        </HStack>
      )}

      {/* Local Authentication */}
      {localProvider && !hideLocalAuth && (
        <Button
          onClick={() => handleProviderClick(localProvider)}
          disabled={isLoading}
          w="100%"
          size="lg"
          variant="outline"
          colorScheme="gray"
        >
          <HStack gap={3}>
            <Icon as={LuKey} boxSize={5} />
            <Text>{t('auth.signInWithCredentials')}</Text>
          </HStack>
        </Button>
      )}
    </VStack>
  );
};

export default IdentityProviderSelector;
