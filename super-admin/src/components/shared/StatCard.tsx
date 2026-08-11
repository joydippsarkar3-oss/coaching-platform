import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  trend?: number; // positive = up, negative = down
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, trend, loading }) => {
  return (
    <Card loading={loading} className="h-full">
      <Statistic
        title={<span className="text-gray-500 text-sm font-medium">{title}</span>}
        value={value}
        prefix={prefix}
        suffix={
          trend !== undefined ? (
            <span
              className={`text-sm ml-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(trend)}%
            </span>
          ) : undefined
        }
        valueStyle={{ fontSize: '24px', fontWeight: 700 }}
      />
    </Card>
  );
};
