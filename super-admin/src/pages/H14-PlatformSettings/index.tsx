import React, { useState } from 'react';
import {
  Card, Button, Tabs, Space, Tag, message, Form, Input, Select,
  Switch, Row, Col, Typography, Divider, InputNumber, ColorPicker, Upload
} from 'antd';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader';
import { settingsApi } from '@/api/endpoints/settings';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { PlatformSettings, PackageTier } from '@/types/models';
import type { ApiResponse } from '@/types/api';

const { TabPane } = Tabs;
const { Option } = Select;

const TIERS: PackageTier[] = ['BASIC', 'STANDARD', 'PREMIUM', 'ELITE'];

const FEATURE_MODULES = ['wallet', 'typing', 'placement', 'analytics'];

export default function PlatformSettings() {
  const { t } = useTranslation();
  const [brandingForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [wabaForm] = Form.useForm();
  const [smsForm] = Form.useForm();
  const [versionForm] = Form.useForm();
  const [featureFlags, setFeatureFlags] = useState<Record<string, Record<PackageTier, boolean>>>(
    FEATURE_MODULES.reduce((acc, mod) => ({
      ...acc,
      [mod]: TIERS.reduce((ta, tier) => ({ ...ta, [tier]: false }), {} as Record<PackageTier, boolean>),
    }), {})
  );

  const { data: settingsRes, mutate } = usePollingApi<ApiResponse<PlatformSettings>>(
    '/api/v1/settings', 60_000
  );

  const settings = settingsRes?.data;

  React.useEffect(() => {
    if (!settings) return;
    brandingForm.setFieldsValue(settings.branding);
    paymentForm.setFieldsValue({
      ...settings.payment,
      razorpayKeySecret: '••••••••',
      cashfreeSecretKey: '••••••••',
    });
    wabaForm.setFieldsValue({ ...settings.waba, apiToken: '••••••••' });
    smsForm.setFieldsValue(settings.sms);
    versionForm.setFieldsValue(settings.appVersion);
    if (settings.featureFlags) setFeatureFlags(settings.featureFlags);
  }, [settings]);

  const handleSaveSection = async (section: keyof PlatformSettings, values: unknown) => {
    try {
      await settingsApi.update({ [section]: values });
      message.success('Settings saved');
      mutate();
    } catch {
      message.error('Save failed');
    }
  };

  const handleToggleFeature = async (mod: string, tier: PackageTier, enabled: boolean) => {
    const updated = {
      ...featureFlags,
      [mod]: { ...featureFlags[mod], [tier]: enabled },
    };
    setFeatureFlags(updated);
    try {
      await settingsApi.update({ featureFlags: updated });
      message.success('Feature flag updated');
    } catch {
      message.error('Update failed');
    }
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} />

      <Tabs defaultActiveKey="branding">
        {/* Branding */}
        <TabPane tab={t('settings.branding')} key="branding">
          <Card style={{ maxWidth: 640 }}>
            <Form
              form={brandingForm}
              layout="vertical"
              onFinish={(v) => handleSaveSection('branding', v)}
            >
              <Form.Item label="Logo">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      const res = await settingsApi.uploadLogo(file as File);
                      brandingForm.setFieldValue('logoUrl', res.data.url);
                      onSuccess?.({});
                    } catch {
                      onError?.(new Error('Upload failed'));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Logo</Button>
                </Upload>
              </Form.Item>

              <Form.Item name="accentColor" label={t('settings.accentColor')}>
                <Input placeholder="#2563eb" />
              </Form.Item>

              <Form.Item name="pwaName" label={t('settings.pwaName')}>
                <Input placeholder="Binary Brain" />
              </Form.Item>

              <Form.Item label="PWA Icon">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      const res = await settingsApi.uploadPwaIcon(file as File);
                      brandingForm.setFieldValue('pwaIconUrl', res.data.url);
                      onSuccess?.({});
                    } catch {
                      onError?.(new Error('Upload failed'));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload PWA Icon (512×512)</Button>
                </Upload>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* Payment */}
        <TabPane tab={t('settings.payment')} key="payment">
          <Card style={{ maxWidth: 640 }}>
            <Form
              form={paymentForm}
              layout="vertical"
              onFinish={(v) => handleSaveSection('payment', v)}
            >
              <Form.Item name="gateway" label={t('settings.gateway')} rules={[{ required: true }]}>
                <Select>
                  <Option value="RAZORPAY">Razorpay</Option>
                  <Option value="CASHFREE">Cashfree</Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">Razorpay</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="razorpayKeyId" label="Key ID">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="razorpayKeySecret" label="Key Secret">
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Cashfree</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="cashfreeAppId" label="App ID">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="cashfreeSecretKey" label="Secret Key">
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">{t('settings.splitPct')} by Package Tier</Divider>
              <Row gutter={16}>
                {TIERS.map((tier) => (
                  <Col key={tier} span={6}>
                    <Form.Item name={['splitByTier', tier]} label={tier}>
                      <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                ))}
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* WABA */}
        <TabPane tab={t('settings.waba')} key="waba">
          <Card style={{ maxWidth: 560 }}>
            <Form
              form={wabaForm}
              layout="vertical"
              onFinish={(v) => handleSaveSection('waba', v)}
            >
              <Form.Item name="wabaId" label={t('settings.wabaId')}>
                <Input />
              </Form.Item>
              <Form.Item name="phoneNumberId" label={t('settings.phoneNumberId')}>
                <Input />
              </Form.Item>
              <Form.Item name="apiToken" label={t('settings.apiToken')}>
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* SMS/DLT */}
        <TabPane tab={t('settings.sms')} key="sms">
          <Card style={{ maxWidth: 560 }}>
            <Form
              form={smsForm}
              layout="vertical"
              onFinish={(v) => handleSaveSection('sms', v)}
            >
              <Form.Item name="senderId" label={t('settings.senderId')}>
                <Input placeholder="BBRAIN" maxLength={11} />
              </Form.Item>
              <Form.Item name="gateway" label={t('settings.gateway')}>
                <Select>
                  <Option value="TEXTLOCAL">Textlocal</Option>
                  <Option value="MSG91">MSG91</Option>
                  <Option value="TWILIO">Twilio</Option>
                </Select>
              </Form.Item>
              <Form.Item name="dltEntityId" label={t('settings.dltEntityId')}>
                <Input placeholder="DLT registered entity ID" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* Feature Flags */}
        <TabPane tab={t('settings.featureFlags')} key="flags">
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px', background: '#f5f5f5' }}>
                      Module
                    </th>
                    {TIERS.map((tier) => (
                      <th
                        key={tier}
                        style={{ textAlign: 'center', padding: '8px 12px', background: '#f5f5f5' }}
                      >
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MODULES.map((mod) => (
                    <tr key={mod} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <Typography.Text strong style={{ textTransform: 'capitalize' }}>
                          {mod}
                        </Typography.Text>
                      </td>
                      {TIERS.map((tier) => (
                        <td key={tier} style={{ textAlign: 'center', padding: '10px 12px' }}>
                          <Switch
                            size="small"
                            checked={featureFlags[mod]?.[tier] ?? false}
                            onChange={(checked) => handleToggleFeature(mod, tier, checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabPane>

        {/* App Version */}
        <TabPane tab={t('settings.appVersion')} key="version">
          <Card style={{ maxWidth: 480 }}>
            <Form
              form={versionForm}
              layout="vertical"
              onFinish={(v) => handleSaveSection('appVersion', v)}
            >
              <Form.Item
                name="minimum"
                label={t('settings.minVersion')}
                extra="Semver format: 1.2.3"
              >
                <Input placeholder="1.0.0" />
              </Form.Item>
              <Form.Item
                name="forceUpdate"
                label={t('settings.forceUpdate')}
                valuePropName="checked"
                extra="Users below minimum version will be forced to update"
              >
                <Switch />
              </Form.Item>
              <Form.Item name="updateMessage" label={t('settings.updateMessage')}>
                <Input.TextArea
                  rows={3}
                  placeholder="A new version is available. Please update to continue."
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {t('common.save')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
