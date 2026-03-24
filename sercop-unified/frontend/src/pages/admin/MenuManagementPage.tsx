import { Container, Box } from '@chakra-ui/react';
import { MenuConfigPanel } from '../../components/admin/MenuConfigPanel';

export default function MenuManagementPage() {
  return (
    <Container maxW="container.2xl" py={6}>
      <Box>
        <MenuConfigPanel autoRefresh={false} />
      </Box>
    </Container>
  );
}
