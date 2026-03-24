/**
 * Users Page
 * Uses UsersAdminPanel for full user management with approval workflow
 */
import { Box } from '@chakra-ui/react';
import { UsersAdminPanel } from '../components/admin/UsersAdminPanel';
import { useTheme } from '../contexts/ThemeContext';

export const Users = () => {
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <Box p={6} bg={colors.bgColor} minH="100vh">
      <UsersAdminPanel />
    </Box>
  );
};
