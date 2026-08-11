import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, extra }) => {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          className="mb-2"
          items={breadcrumbs.map((b) => ({ title: b.href ? <a href={b.href}>{b.title}</a> : b.title }))}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <Typography.Title level={3} className="!mb-0">
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" className="text-sm">
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  );
};
