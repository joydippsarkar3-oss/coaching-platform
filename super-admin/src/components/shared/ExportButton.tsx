import React from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface Column {
  key: string;
  label: string;
}

interface ExportButtonProps {
  filename: string;
  columns: Column[];
  data: Record<string, unknown>[];
  disabled?: boolean;
}

function toCSV(columns: Column[], data: Record<string, unknown>[]): string {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val == null ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export const ExportButton: React.FC<ExportButtonProps> = ({ filename, columns, data, disabled }) => {
  const { t } = useTranslation();

  const handleExport = () => {
    if (!data.length) {
      message.warning('No data to export');
      return;
    }
    const csv = toCSV(columns, data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={disabled}>
      {t('common.export')}
    </Button>
  );
};
