import { Redirect } from 'expo-router';
import { FullScreenLoader } from '@/components/fullScreenLoader';
import { useAuth } from '@/features/auth';
import { AuthenticatedProfile } from './components/authenticatedProfile';

export default function ProfileScreen() {
  const { currentUser, isAuthenticated, isHydratingAuth } = useAuth();

  if (isHydratingAuth) return <FullScreenLoader />;
  if (!isAuthenticated || !currentUser?.id) return <Redirect href="/login" />;

  return (
    <AuthenticatedProfile
      userId={currentUser.id}
      email={currentUser.email}
      displayName={currentUser.displayName}
    />
  );
}
