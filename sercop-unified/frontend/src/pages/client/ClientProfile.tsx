import { Box, Heading, Text, VStack, Card, SimpleGrid, Button, Input, HStack, Avatar, Spinner, Badge } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { FiSave, FiBriefcase, FiMail, FiPhone, FiMapPin, FiUser } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import clientPortalService from '../../services/clientPortalService';
import type { ClientCompanyInfo } from '../../services/clientPortalService';
import { useTheme } from '../../contexts/ThemeContext';

const FormField = ({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) => (
  <VStack align="stretch" gap={1}>
    <HStack gap={2}>
      {icon && <Box color="gray.500">{icon}</Box>}
      <Text fontWeight="medium" fontSize="sm" color="gray.600">{label}</Text>
    </HStack>
    {children}
  </VStack>
);

export const ClientProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getColors } = useTheme();
  const colors = getColors();
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState<ClientCompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.participantId) {
      loadCompanyInfo();
    }
  }, [user?.participantId]);

  const loadCompanyInfo = async () => {
    if (!user?.participantId) return;

    try {
      setLoading(true);
      const data = await clientPortalService.getMyCompany();
      setCompany(data);
    } catch (err) {
      console.error('Error loading company info:', err);
      // Silently fail - we'll show whatever info we have from user context
    } finally {
      setLoading(false);
    }
  };

  const getParticipantTypeLabel = (tipo?: string) => {
    const types: Record<string, string> = {
      CLIENTE: t('participant.type.client', 'Client'),
      PROVEEDOR: t('participant.type.supplier', 'Supplier'),
      CONTRAPARTE: t('participant.type.counterparty', 'Counterparty'),
      BANCO: t('participant.type.bank', 'Bank'),
    };
    return tipo ? types[tipo] || tipo : '-';
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              {t('clientPortal.profile.title', 'My Profile')}
            </Heading>
            <Text color="gray.600">
              {t('clientPortal.profile.subtitle', 'View and update your profile information')}
            </Text>
          </Box>
          <Button
            colorScheme={isEditing ? 'green' : 'blue'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <FiSave style={{ marginRight: 8 }} />
                {t('common.save', 'Save')}
              </>
            ) : (
              t('common.edit', 'Edit')
            )}
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('clientPortal.profile.personalInfo', 'Personal Information')}</Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="center" mb={6}>
                <Avatar.Root size="2xl">
                  <Avatar.Fallback>
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </Avatar.Fallback>
                </Avatar.Root>
                <Text fontWeight="bold" fontSize="lg">{user?.name || user?.username}</Text>
                <Text color="gray.500">{user?.email}</Text>
              </VStack>

              <VStack gap={4}>
                <FormField label={t('clientPortal.profile.fullName', 'Full Name')}>
                  <Input
                    defaultValue={user?.name || ''}
                    disabled={!isEditing}
                  />
                </FormField>
                <FormField label={t('clientPortal.profile.email', 'Email')}>
                  <Input
                    defaultValue={user?.email || ''}
                    disabled
                    type="email"
                  />
                </FormField>
                <FormField label={t('clientPortal.profile.phone', 'Phone')}>
                  <Input
                    placeholder="+1 234 567 890"
                    disabled={!isEditing}
                  />
                </FormField>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <HStack justify="space-between">
                <Heading size="md">{t('clientPortal.profile.companyInfo', 'Company Information')}</Heading>
                {company && (
                  <Badge colorPalette="blue" size="sm">
                    {getParticipantTypeLabel(company.tipo)}
                  </Badge>
                )}
              </HStack>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <VStack py={4}>
                  <Spinner size="md" color={colors.primaryColor} />
                </VStack>
              ) : (
                <VStack gap={4}>
                  <FormField label={t('clientPortal.profile.company', 'Company')} icon={<FiBriefcase size={14} />}>
                    <Input
                      value={company?.nombres || user?.participantName || '-'}
                      disabled
                      bg={colors.bgSurface}
                    />
                  </FormField>
                  <FormField label={t('clientPortal.profile.companyId', 'Company ID')} icon={<FiUser size={14} />}>
                    <Input
                      value={company?.identificacion || (user?.participantId ? `#${user.participantId}` : '-')}
                      disabled
                      bg={colors.bgSurface}
                    />
                  </FormField>
                  {company?.email && (
                    <FormField label={t('clientPortal.profile.companyEmail', 'Company Email')} icon={<FiMail size={14} />}>
                      <Input
                        value={company.email}
                        disabled
                        bg={colors.bgSurface}
                      />
                    </FormField>
                  )}
                  {company?.telefono && (
                    <FormField label={t('clientPortal.profile.companyPhone', 'Company Phone')} icon={<FiPhone size={14} />}>
                      <Input
                        value={company.telefono}
                        disabled
                        bg={colors.bgSurface}
                      />
                    </FormField>
                  )}
                  {company?.direccion && (
                    <FormField label={t('clientPortal.profile.companyAddress', 'Address')} icon={<FiMapPin size={14} />}>
                      <Input
                        value={company.direccion}
                        disabled
                        bg={colors.bgSurface}
                      />
                    </FormField>
                  )}
                  {company?.ejecutivoAsignado && (
                    <FormField label={t('clientPortal.profile.assignedExecutive', 'Assigned Executive')}>
                      <Input
                        value={company.ejecutivoAsignado}
                        disabled
                        bg={colors.bgSurface}
                      />
                    </FormField>
                  )}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('clientPortal.profile.preferences', 'Preferences')}</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4}>
                <FormField label={t('clientPortal.profile.language', 'Language')}>
                  <Input
                    defaultValue="English"
                    disabled={!isEditing}
                  />
                </FormField>
                <FormField label={t('clientPortal.profile.timezone', 'Timezone')}>
                  <Input
                    defaultValue="America/Guayaquil"
                    disabled={!isEditing}
                  />
                </FormField>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('clientPortal.profile.security', 'Security')}</Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Button variant="outline">
                  {t('clientPortal.profile.changePassword', 'Change Password')}
                </Button>
                <Button variant="outline">
                  {t('clientPortal.profile.setupMfa', 'Setup Two-Factor Authentication')}
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ClientProfile;
