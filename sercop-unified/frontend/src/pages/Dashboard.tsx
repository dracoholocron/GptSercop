import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';
import { ContentArea } from '../components/ContentArea';

export const Dashboard = ({ children }: { children?: React.ReactNode }) => {
  return (
    <ResponsiveLayout>
      {children || <ContentArea />}
    </ResponsiveLayout>
  );
};
