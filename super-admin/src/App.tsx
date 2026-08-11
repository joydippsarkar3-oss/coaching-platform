import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { SWRConfig } from 'swr';
import { AppRouter } from './router';
import './i18n';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 6,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <AntApp>
        <SWRConfig
          value={{
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            onError: (error) => {
              if (error?.response?.status !== 401) {
                console.error('SWR error:', error);
              }
            },
          }}
        >
          <AppRouter />
        </SWRConfig>
      </AntApp>
    </ConfigProvider>
  );
}
