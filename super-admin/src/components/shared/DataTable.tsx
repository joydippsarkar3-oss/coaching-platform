import React from 'react';
import { Table, type TableProps, type TableColumnsType } from 'antd';
import { ExportButton } from './ExportButton';

interface DataTableProps<T extends object> extends TableProps<T> {
  exportFilename?: string;
  exportColumns?: { key: string; label: string }[];
  headerExtra?: React.ReactNode;
}

export function DataTable<T extends object>({
  exportFilename,
  exportColumns,
  headerExtra,
  ...tableProps
}: DataTableProps<T>) {
  const dataSource = (tableProps.dataSource ?? []) as Record<string, unknown>[];

  return (
    <div>
      {(exportFilename || headerExtra) && (
        <div className="flex justify-end gap-2 mb-3">
          {headerExtra}
          {exportFilename && exportColumns && (
            <ExportButton
              filename={exportFilename}
              columns={exportColumns}
              data={dataSource}
            />
          )}
        </div>
      )}
      <Table
        size="small"
        scroll={{ x: 'max-content' }}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
          defaultPageSize: 20,
        }}
        {...tableProps}
      />
    </div>
  );
}
