import React, { useState } from 'react';
import {
  Card, Button, Tabs, Space, Tag, message, Modal, Form, Input, Select,
  InputNumber, Row, Col, Typography, Divider
} from 'antd';
import { DownloadOutlined, SendOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { MoneyDisplay } from '@/components/shared/MoneyDisplay';
import { financeApi } from '@/api/endpoints/finance';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { HoCharge, LedgerEntry, Settlement } from '@/types/models';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import { formatDate } from '@/utils/dates';
import { paiseToRupees } from '@/utils/money';

const { TabPane } = Tabs;

export default function NetworkFinance() {
  const { t } = useTranslation();
  const [ledgerCenter, setLedgerCenter] = useState<string>('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<{ count: number; preview: unknown[] } | null>(null);
  const [sendingInvoices, setSendingInvoices] = useState(false);

  const { data: chargesData, mutate: mutateCharges } = usePollingApi<ApiResponse<HoCharge[]>>(
    '/api/v1/finance/ho-charges', 60_000
  );
  const { data: ledgerData } = usePollingApi<PaginatedResponse<LedgerEntry>>(
    ledgerCenter ? `/api/v1/finance/ledger/${ledgerCenter}` : null, 30_000
  );
  const { data: settlementsData } = usePollingApi<PaginatedResponse<Settlement>>(
    '/api/v1/finance/settlements', 30_000
  );
  const { data: collectionsData } = usePollingApi<ApiResponse<unknown[]>>(
    '/api/v1/finance/collections-chart', 60_000
  );
  const { data: walletData } = usePollingApi<ApiResponse<{ total: number; breakdown: unknown[] }>>(
    '/api/v1/finance/wallet-liability', 60_000
  );

  const charges = chargesData?.data ?? [];
  const ledger = ledgerData?.data ?? [];
  const settlements = settlementsData?.data ?? [];
  const collectionsChart = (collectionsData?.data as { month: string; collected: number; dues: number }[]) ?? [];
  const walletLiability = walletData?.data;

  const handleGenerateInvoices = async () => {
    try {
      const res = await financeApi.generateMonthlyInvoices() as ApiResponse<{ count: number; preview: unknown[] }>;
      setInvoicePreview(res.data);
      setInvoiceModalOpen(true);
    } catch {
      message.error('Failed to generate invoices');
    }
  };

  const handleSendInvoices = async () => {
    setSendingInvoices(true);
    try {
      await financeApi.sendInvoices([]);
      message.success('Invoices sent to all centers');
      setInvoiceModalOpen(false);
    } catch {
      message.error('Send failed');
    } finally {
      setSendingInvoices(false);
    }
  };

  const chargesColumns = [
    { title: 'Course', dataIndex: 'courseName', key: 'courseName' },
    {
      title: t('finance.admissionCharge'),
      dataIndex: 'admissionCharge',
      key: 'admissionCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('finance.certCharge'),
      dataIndex: 'certificateCharge',
      key: 'certCharge',
      render: (v: number) => <MoneyDisplay paise={v} />,
    },
    {
      title: t('finance.royaltyPct'),
      dataIndex: 'royaltyPct',
      key: 'royaltyPct',
      render: (v: number) => `${v}%`,
    },
  ];

  const ledgerColumns = [
    { title: t('common.date'), dataIndex: 'date', key: 'date', render: (v: string) => formatDate(v) },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: t('finance.debit'), dataIndex: 'debit', key: 'debit', render: (v: number) => v ? <MoneyDisplay paise={v} /> : '—' },
    { title: t('finance.credit'), dataIndex: 'credit', key: 'credit', render: (v: number) => v ? <MoneyDisplay paise={v} /> : '—' },
    { title: t('finance.balance'), dataIndex: 'balance', key: 'balance', render: (v: number) => <MoneyDisplay paise={v} /> },
  ];

  const settlementColumns = [
    { title: 'Center', dataIndex: 'centerName', key: 'centerName' },
    { title: 'Gateway', dataIndex: 'gateway', key: 'gateway' },
    { title: 'Split %', dataIndex: 'splitPct', key: 'splitPct', render: (v: number) => `${v}%` },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <MoneyDisplay paise={v} /> },
    { title: 'Scheduled', dataIndex: 'scheduledAt', key: 'scheduledAt', render: (v: string) => formatDate(v) },
    { title: t('common.status'), dataIndex: 'status', key: 'status', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t('finance.title')}
        extra={
          <Button type="primary" icon={<SendOutlined />} onClick={handleGenerateInvoices}>
            {t('finance.generateInvoices')}
          </Button>
        }
      />

      <Tabs defaultActiveKey="charges">
        <TabPane tab={t('finance.hoCharges')} key="charges">
          <DataTable<HoCharge>
            dataSource={charges}
            columns={chargesColumns}
            rowKey="courseId"
            exportFilename="ho-charges"
            exportColumns={[
              { key: 'courseName', label: 'Course' },
              { key: 'admissionCharge', label: 'Admission Charge (paise)' },
              { key: 'certificateCharge', label: 'Cert Charge (paise)' },
              { key: 'royaltyPct', label: 'Royalty %' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('finance.centerLedger')} key="ledger">
          <Form.Item label="Select Center" className="mb-4">
            <Select
              showSearch
              style={{ width: 320 }}
              placeholder="Search center..."
              onSelect={(v: string) => setLedgerCenter(v)}
            >
              <Select.Option value="demo-center-1">Demo Center 1 — Mumbai</Select.Option>
              <Select.Option value="demo-center-2">Demo Center 2 — Delhi</Select.Option>
            </Select>
          </Form.Item>
          {ledgerCenter && (
            <DataTable<LedgerEntry>
              dataSource={ledger}
              columns={ledgerColumns}
              rowKey="id"
              exportFilename={`ledger-${ledgerCenter}`}
              exportColumns={[
                { key: 'date', label: 'Date' },
                { key: 'description', label: 'Description' },
                { key: 'debit', label: 'Debit (paise)' },
                { key: 'credit', label: 'Credit (paise)' },
                { key: 'balance', label: 'Balance (paise)' },
              ]}
            />
          )}
        </TabPane>

        <TabPane tab={t('finance.settlements')} key="settlements">
          <DataTable<Settlement>
            dataSource={settlements}
            columns={settlementColumns}
            rowKey="id"
            exportFilename="settlements"
            exportColumns={[
              { key: 'centerName', label: 'Center' },
              { key: 'gateway', label: 'Gateway' },
              { key: 'amount', label: 'Amount (paise)' },
              { key: 'status', label: 'Status' },
            ]}
          />
        </TabPane>

        <TabPane tab={t('finance.walletLiability')} key="wallet">
          {walletLiability && (
            <Card style={{ maxWidth: 400 }}>
              <Typography.Title level={4}>Total Outstanding</Typography.Title>
              <Typography.Title level={2} style={{ color: '#f59e0b' }}>
                <MoneyDisplay paise={walletLiability.total} />
              </Typography.Title>
              <Typography.Text type="secondary">Closed-loop wallet credits across network</Typography.Text>
            </Card>
          )}
        </TabPane>

        <TabPane tab={t('finance.collections')} key="collections">
          <Card>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={collectionsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => `₹${paiseToRupees(v).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="dues" name="Dues" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Monthly Invoice Preview"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setInvoiceModalOpen(false)}>Cancel</Button>
            <Button type="primary" loading={sendingInvoices} onClick={handleSendInvoices} icon={<SendOutlined />}>
              Send to All Centers
            </Button>
          </Space>
        }
        width={600}
      >
        {invoicePreview && (
          <div>
            <Typography.Text>
              Ready to generate <strong>{invoicePreview.count}</strong> invoices for all active centers.
            </Typography.Text>
            <pre style={{ background: '#f5f5f5', padding: 12, marginTop: 12, borderRadius: 6, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
              {JSON.stringify(invoicePreview.preview.slice(0, 5), null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
