/**
 * PlatformCapabilities Component
 * Spectacular showcase of GlobalCMX security and enterprise features
 */

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  LuShield,
  LuKey,
  LuUsers,
  LuMail,
  LuEye,
  LuBrain,
  LuLock,
  LuActivity,
  LuCircleCheck,
  LuArrowRight,
  LuSparkles,
  LuGlobe,
  LuServer,
  LuFileText,
} from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
`;

interface FeatureCardProps {
  icon: any;
  titleKey: string;
  descriptionKey: string;
  features: string[];
  gradient: string;
  accentColor: string;
  badge?: string;
  path?: string;
  delay?: number;
}

const FeatureCard = ({
  icon,
  titleKey,
  descriptionKey,
  features,
  gradient,
  accentColor,
  badge,
  path,
  delay = 0,
}: FeatureCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      position="relative"
      p={6}
      borderRadius="2xl"
      bg={isDark
        ? 'linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'
      }
      border="1px solid"
      borderColor={isHovered ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.200')}
      boxShadow={isHovered
        ? `0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px ${accentColor}`
        : '0 4px 20px rgba(0, 0, 0, 0.1)'
      }
      transform={isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0)'}
      transition="all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
      cursor="pointer"
      overflow="hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => path && navigate(path)}
      role="group"
      sx={{
        animation: `${float} 6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Gradient Overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="4px"
        bgGradient={gradient}
        opacity={isHovered ? 1 : 0.7}
        transition="opacity 0.3s"
      />

      {/* Shimmer Effect on Hover */}
      {isHovered && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={`linear-gradient(90deg, transparent, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)'}, transparent)`}
          backgroundSize="200% 100%"
          animation={`${shimmer} 1.5s infinite`}
          pointerEvents="none"
        />
      )}

      {/* Badge */}
      {badge && (
        <Badge
          position="absolute"
          top={4}
          right={4}
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
          bgGradient={gradient}
          color="white"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {badge}
        </Badge>
      )}

      <VStack align="start" gap={4}>
        {/* Icon Container */}
        <Box
          p={4}
          borderRadius="xl"
          bgGradient={gradient}
          boxShadow={`0 8px 24px ${accentColor}40`}
          transition="all 0.3s"
          _groupHover={{
            transform: 'rotate(-5deg) scale(1.1)',
            boxShadow: `0 12px 32px ${accentColor}60`,
          }}
        >
          <Icon as={icon} boxSize={8} color="white" />
        </Box>

        {/* Title */}
        <Heading
          size="md"
          fontWeight="bold"
          bgGradient={isHovered ? gradient : undefined}
          bgClip={isHovered ? 'text' : undefined}
          color={isHovered ? undefined : (isDark ? 'white' : 'gray.800')}
          transition="all 0.3s"
        >
          {t(titleKey)}
        </Heading>

        {/* Description */}
        <Text
          fontSize="sm"
          color={isDark ? 'gray.400' : 'gray.600'}
          lineHeight="tall"
        >
          {t(descriptionKey)}
        </Text>

        {/* Features List */}
        <VStack align="start" gap={2} w="full">
          {features.map((feature, idx) => (
            <HStack key={idx} gap={2}>
              <Icon
                as={LuCircleCheck}
                boxSize={4}
                color={accentColor}
                opacity={0.9}
              />
              <Text fontSize="xs" color={isDark ? 'gray.300' : 'gray.700'}>
                {t(feature)}
              </Text>
            </HStack>
          ))}
        </VStack>

        {/* Action Button */}
        {path && (
          <Button
            size="sm"
            variant="ghost"
            color={accentColor}
            rightIcon={<LuArrowRight />}
            _hover={{
              bg: `${accentColor}15`,
              transform: 'translateX(4px)',
            }}
            transition="all 0.2s"
            mt={2}
          >
            {t('platformCapabilities.configure')}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export const PlatformCapabilities = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const capabilities = [
    {
      icon: LuShield,
      titleKey: 'platformCapabilities.security.title',
      descriptionKey: 'platformCapabilities.security.description',
      features: [
        'platformCapabilities.security.feature1',
        'platformCapabilities.security.feature2',
        'platformCapabilities.security.feature3',
      ],
      gradient: 'linear(to-br, blue.400, blue.600, indigo.600)',
      accentColor: '#3B82F6',
      badge: 'Enterprise',
      path: '/admin/security-configuration',
      delay: 0,
    },
    {
      icon: LuKey,
      titleKey: 'platformCapabilities.authentication.title',
      descriptionKey: 'platformCapabilities.authentication.description',
      features: [
        'platformCapabilities.authentication.feature1',
        'platformCapabilities.authentication.feature2',
        'platformCapabilities.authentication.feature3',
      ],
      gradient: 'linear(to-br, purple.400, purple.600, pink.500)',
      accentColor: '#8B5CF6',
      path: '/admin/security-configuration',
      delay: 0.1,
    },
    {
      icon: LuUsers,
      titleKey: 'platformCapabilities.authorization.title',
      descriptionKey: 'platformCapabilities.authorization.description',
      features: [
        'platformCapabilities.authorization.feature1',
        'platformCapabilities.authorization.feature2',
        'platformCapabilities.authorization.feature3',
      ],
      gradient: 'linear(to-br, cyan.400, teal.500, green.500)',
      accentColor: '#14B8A6',
      path: '/admin/security-configuration',
      delay: 0.2,
    },
    {
      icon: LuEye,
      titleKey: 'platformCapabilities.fourEyes.title',
      descriptionKey: 'platformCapabilities.fourEyes.description',
      features: [
        'platformCapabilities.fourEyes.feature1',
        'platformCapabilities.fourEyes.feature2',
        'platformCapabilities.fourEyes.feature3',
      ],
      gradient: 'linear(to-br, orange.400, red.500, pink.500)',
      accentColor: '#F97316',
      badge: 'Compliance',
      path: '/admin/security-configuration',
      delay: 0.3,
    },
    {
      icon: LuMail,
      titleKey: 'platformCapabilities.email.title',
      descriptionKey: 'platformCapabilities.email.description',
      features: [
        'platformCapabilities.email.feature1',
        'platformCapabilities.email.feature2',
        'platformCapabilities.email.feature3',
      ],
      gradient: 'linear(to-br, green.400, emerald.500, teal.500)',
      accentColor: '#10B981',
      path: '/admin/email-providers',
      delay: 0.4,
    },
    {
      icon: LuFileText,
      titleKey: 'platformCapabilities.audit.title',
      descriptionKey: 'platformCapabilities.audit.description',
      features: [
        'platformCapabilities.audit.feature1',
        'platformCapabilities.audit.feature2',
        'platformCapabilities.audit.feature3',
      ],
      gradient: 'linear(to-br, amber.400, orange.500, red.400)',
      accentColor: '#F59E0B',
      badge: 'SOX Ready',
      path: '/admin/security-configuration',
      delay: 0.5,
    },
  ];

  return (
    <Box
      p={{ base: 4, md: 8 }}
      borderRadius="3xl"
      bg={isDark
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
        : 'linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.7) 100%)'
      }
      border="1px solid"
      borderColor={isDark ? 'whiteAlpha.100' : 'gray.200'}
      position="relative"
      overflow="hidden"
    >
      {/* Background Decorations */}
      <Box
        position="absolute"
        top="-100px"
        right="-100px"
        width="400px"
        height="400px"
        borderRadius="full"
        bg="blue.500"
        opacity={0.03}
        filter="blur(60px)"
      />
      <Box
        position="absolute"
        bottom="-50px"
        left="-50px"
        width="300px"
        height="300px"
        borderRadius="full"
        bg="purple.500"
        opacity={0.03}
        filter="blur(60px)"
      />

      {/* Header */}
      <VStack gap={4} mb={8} textAlign="center" position="relative">
        <HStack gap={2}>
          <Icon
            as={LuSparkles}
            boxSize={6}
            color="blue.400"
            animation={`${pulse} 2s ease-in-out infinite`}
          />
          <Badge
            px={4}
            py={1}
            borderRadius="full"
            bgGradient="linear(to-r, blue.400, purple.500)"
            color="white"
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {t('platformCapabilities.badge')}
          </Badge>
          <Icon
            as={LuSparkles}
            boxSize={6}
            color="purple.400"
            animation={`${pulse} 2s ease-in-out infinite`}
            sx={{ animationDelay: '0.5s' }}
          />
        </HStack>

        <Heading
          size={{ base: 'xl', md: '2xl' }}
          fontWeight="extrabold"
          bgGradient={isDark
            ? 'linear(to-r, blue.300, purple.300, pink.300)'
            : 'linear(to-r, blue.600, purple.600, pink.600)'
          }
          bgClip="text"
          letterSpacing="tight"
        >
          {t('platformCapabilities.title')}
        </Heading>

        <Text
          fontSize={{ base: 'md', md: 'lg' }}
          color={isDark ? 'gray.400' : 'gray.600'}
          maxW="2xl"
          lineHeight="tall"
        >
          {t('platformCapabilities.subtitle')}
        </Text>

        {/* Stats Row */}
        <HStack gap={8} mt={4} flexWrap="wrap" justify="center">
          {[
            { value: '99.9%', label: t('platformCapabilities.stats.uptime') },
            { value: 'SOC 2', label: t('platformCapabilities.stats.certified') },
            { value: '256-bit', label: t('platformCapabilities.stats.encryption') },
            { value: '24/7', label: t('platformCapabilities.stats.monitoring') },
          ].map((stat, idx) => (
            <VStack key={idx} gap={0}>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                bgGradient="linear(to-r, blue.400, cyan.400)"
                bgClip="text"
              >
                {stat.value}
              </Text>
              <Text fontSize="xs" color={isDark ? 'gray.500' : 'gray.500'}>
                {stat.label}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>

      {/* Feature Cards Grid */}
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        gap={{ base: 4, md: 6 }}
        position="relative"
      >
        {capabilities.map((capability, index) => (
          <FeatureCard key={index} {...capability} />
        ))}
      </SimpleGrid>

      {/* Bottom CTA */}
      <Box
        mt={8}
        p={6}
        borderRadius="2xl"
        bgGradient={isDark
          ? 'linear(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
          : 'linear(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }
        border="1px solid"
        borderColor={isDark ? 'blue.500/30' : 'blue.200'}
        textAlign="center"
        position="relative"
        overflow="hidden"
        animation={`${glow} 3s ease-in-out infinite`}
      >
        <HStack justify="center" gap={3} flexWrap="wrap">
          <Icon as={LuGlobe} boxSize={6} color="blue.400" />
          <Text
            fontSize="lg"
            fontWeight="semibold"
            color={isDark ? 'white' : 'gray.800'}
          >
            {t('platformCapabilities.cta.title')}
          </Text>
          <Text color={isDark ? 'gray.400' : 'gray.600'}>
            {t('platformCapabilities.cta.subtitle')}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default PlatformCapabilities;
