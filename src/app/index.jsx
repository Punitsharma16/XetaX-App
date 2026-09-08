import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/state/auth';
import { Loading } from '@/ui';

export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') return <Loading text="Opening XetaX…" />;
  return <Redirect href={status === 'signedIn' ? '/(tabs)' : '/(auth)/login'} />;
}
