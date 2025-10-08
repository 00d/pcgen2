'use client';

import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import Layout from '../components/Layout';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <Layout>{children}</Layout>
    </Provider>
  );
}
