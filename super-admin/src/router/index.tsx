import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrivateRoute } from './PrivateRoute';

const LoginPage = lazy(() => import('@/pages/Login'));
const NetworkDashboard = lazy(() => import('@/pages/H1-NetworkDashboard'));
const CenterLifecycle = lazy(() => import('@/pages/H2-CenterLifecycle'));
const CatalogGovernance = lazy(() => import('@/pages/H3-CatalogGovernance'));
const QuestionBanks = lazy(() => import('@/pages/H4-QuestionBanks'));
const ExamMasters = lazy(() => import('@/pages/H5-ExamMasters'));
const CertificateAuthority = lazy(() => import('@/pages/H6-CertificateAuthority'));
const NetworkFinance = lazy(() => import('@/pages/H7-NetworkFinance'));
const CommsCenter = lazy(() => import('@/pages/H8-CommsCenter'));
const UsersRoles = lazy(() => import('@/pages/H12-UsersRoles'));
const AuditCompliance = lazy(() => import('@/pages/H13-AuditCompliance'));
const PlatformSettings = lazy(() => import('@/pages/H14-PlatformSettings'));
const FranchiseCRMPage = lazy(() => import('@/pages/H9-FranchiseCRM'));
const SupportDeskPage = lazy(() => import('@/pages/H10-SupportDesk'));
const ContentDistributionPage = lazy(() => import('@/pages/H11-ContentDistribution'));
const AnalyticsPage = lazy(() => import('@/pages/H15-Analytics'));

const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <Spin size="large" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: <Suspense fallback={<Loading />}><NetworkDashboard /></Suspense>,
      },
      {
        path: 'centers',
        element: <Suspense fallback={<Loading />}><CenterLifecycle /></Suspense>,
      },
      {
        path: 'catalog',
        element: <Suspense fallback={<Loading />}><CatalogGovernance /></Suspense>,
      },
      {
        path: 'question-banks',
        element: <Suspense fallback={<Loading />}><QuestionBanks /></Suspense>,
      },
      {
        path: 'exam-masters',
        element: <Suspense fallback={<Loading />}><ExamMasters /></Suspense>,
      },
      {
        path: 'certificates',
        element: <Suspense fallback={<Loading />}><CertificateAuthority /></Suspense>,
      },
      {
        path: 'finance',
        element: <Suspense fallback={<Loading />}><NetworkFinance /></Suspense>,
      },
      {
        path: 'comms',
        element: <Suspense fallback={<Loading />}><CommsCenter /></Suspense>,
      },
      {
        path: 'users',
        element: <Suspense fallback={<Loading />}><UsersRoles /></Suspense>,
      },
      {
        path: 'audit',
        element: <Suspense fallback={<Loading />}><AuditCompliance /></Suspense>,
      },
      {
        path: 'settings',
        element: <Suspense fallback={<Loading />}><PlatformSettings /></Suspense>,
      },
      {
        path: 'franchise-crm',
        element: <Suspense fallback={<Loading />}><FranchiseCRMPage /></Suspense>,
      },
      {
        path: 'support',
        element: <Suspense fallback={<Loading />}><SupportDeskPage /></Suspense>,
      },
      {
        path: 'content',
        element: <Suspense fallback={<Loading />}><ContentDistributionPage /></Suspense>,
      },
      {
        path: 'analytics',
        element: <Suspense fallback={<Loading />}><AnalyticsPage /></Suspense>,
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter: React.FC = () => <RouterProvider router={router} />;
