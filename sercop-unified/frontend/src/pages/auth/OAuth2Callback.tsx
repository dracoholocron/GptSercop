import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { Box, VStack, Spinner, Text, Heading, Button } from '@chakra-ui/react';
import { LuCheck, LuX, LuClock } from 'react-icons/lu';

/**
 * OAuth2 Callback Handler
 * Processes the OAuth2 redirect after SSO authentication
 */
export const OAuth2Callback: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken, hasRole } = useAuth();
  const { refreshStatus, clearBlockedState } = useSchedule();

  const [status, setStatus] = useState<'processing' | 'success' | 'pending' | 'rejected' | 'error'>('processing');
  const [message, setMessage] = useState<string>(t('auth.processingLogin'));
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for token (direct redirect from backend)
      const token = searchParams.get('token');
      const username = searchParams.get('username');
      const provider = searchParams.get('provider');
      const newUser = searchParams.get('newUser') === 'true';
      const name = searchParams.get('name');
      const approvalStatus = searchParams.get('approvalStatus');

      // Check for errors
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage(errorDescription || t('auth.ssoError'));
        return;
      }

      // Handle approval status
      if (approvalStatus === 'PENDING') {
        setStatus('pending');
        setMessage(t('auth.pendingApproval', 'Your account is pending approval by an administrator.'));
        
        // Store pending user info
        localStorage.setItem('pendingUser', JSON.stringify({
          username,
          name: name || username,
          provider: provider || 'SSO'
        }));

        // Redirect to pending approval page after delay
        setTimeout(() => {
          navigate('/pending-approval', { replace: true });
        }, 2000);
        return;
      }

      if (approvalStatus === 'REJECTED') {
        setStatus('rejected');
        setMessage(t('auth.accountRejected', 'Your account registration was rejected. Please contact support.'));
        return;
      }

      // Handle direct token redirect for APPROVED users
      if (token && username) {
        try {
          // Parse roles from query params if available
          const rolesParam = searchParams.get('roles');
          const roles = rolesParam ? rolesParam.split(',') : ['ROLE_USER'];
          const participantId = searchParams.get('participantId');

          // Store token and set auth state
          loginWithToken(token, {
            username,
            name: name || undefined,
            identityProvider: provider || 'SSO',
            roles,
            participantId: participantId ? parseInt(participantId) : undefined
          });

          // Clear any previous blocked state and refresh schedule status
          clearBlockedState();

          // Wait a bit for token to be stored, then refresh schedule status
          await new Promise(resolve => setTimeout(resolve, 500));
          await refreshStatus();

          setIsNewUser(newUser);
          setStatus('success');
          setMessage(newUser ? t('auth.welcomeNewUser') : t('auth.loginSuccess'));

          // Redirect based on user role after short delay
          setTimeout(() => {
            const isClientUser = roles.includes('ROLE_CLIENT');
            navigate(isClientUser ? '/client/dashboard' : '/business-intelligence', { replace: true });
          }, 1500);

        } catch (err) {
          console.error('Token processing error:', err);
          setStatus('error');
          setMessage(t('auth.ssoError'));
        }
        return;
      }

      // No valid parameters
      setStatus('error');
      setMessage(t('auth.invalidCallback', 'Invalid authentication callback.'));
    };

    handleCallback();
  }, [searchParams, navigate, t, loginWithToken, refreshStatus, clearBlockedState]);

  const handleRetry = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)"
    >
      <Box
        bg="white"
        borderRadius="xl"
        boxShadow="2xl"
        p={8}
        maxW="md"
        w="full"
        mx={4}
      >
        <VStack gap={6} textAlign="center">
          {/* Status Icon */}
          <Box>
            {status === 'processing' && (
              <Spinner size="xl" color="blue.500" thickness="4px" />
            )}
            {status === 'success' && (
              <Box
                w={16}
                h={16}
                bg="green.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuCheck size={32} color="green" />
              </Box>
            )}
            {status === 'pending' && (
              <Box
                w={16}
                h={16}
                bg="yellow.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuClock size={32} color="orange" />
              </Box>
            )}
            {(status === 'error' || status === 'rejected') && (
              <Box
                w={16}
                h={16}
                bg="red.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <LuX size={32} color="red" />
              </Box>
            )}
          </Box>

          {/* Title */}
          <Heading size="lg" color="gray.800">
            {status === 'processing' && t('auth.authenticating')}
            {status === 'success' && (isNewUser ? t('auth.welcome') : t('auth.welcomeBack'))}
            {status === 'pending' && t('auth.pendingTitle', 'Pending Approval')}
            {status === 'rejected' && t('auth.rejectedTitle', 'Account Rejected')}
            {status === 'error' && t('auth.authenticationFailed')}
          </Heading>

          {/* Message */}
          <Text
            fontSize="sm"
            color={
              status === 'success' ? 'green.600' :
              status === 'pending' ? 'orange.600' :
              status === 'error' || status === 'rejected' ? 'red.600' :
              'gray.500'
            }
          >
            {message}
          </Text>

          {/* New User Welcome */}
          {status === 'success' && isNewUser && (
            <Box p={4} bg="blue.50" borderRadius="lg">
              <Text fontSize="sm" color="blue.700">
                {t('auth.accountCreated')}
              </Text>
            </Box>
          )}

          {/* Pending Info */}
          {status === 'pending' && (
            <Box p={4} bg="yellow.50" borderRadius="lg">
              <Text fontSize="sm" color="yellow.700">
                {t('auth.pendingInfo', 'You will receive an email notification when your account is approved.')}
              </Text>
            </Box>
          )}

          {/* Error/Rejected Actions */}
          {(status === 'error' || status === 'rejected') && (
            <VStack gap={3} w="full">
              <Button
                onClick={handleRetry}
                colorScheme="blue"
                w="full"
              >
                {t('auth.backToLogin', 'Back to Login')}
              </Button>
              <Text fontSize="xs" color="gray.500">
                {t('auth.contactSupport')}
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default OAuth2Callback;
