import ProtectedRoute from '@/components/ProtectedRoute';

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
