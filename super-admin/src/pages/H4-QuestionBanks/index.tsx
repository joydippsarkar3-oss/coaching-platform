import React, { useState } from 'react';
import {
  Card, Button, Drawer, Form, Input, Select, InputNumber, Space, Tag,
  message, Modal, Upload, Steps, Table, Switch, Row, Col, Divider
} from 'antd';
import {
  PlusOutlined, UploadOutlined, LockOutlined, UnlockOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { questionsApi } from '@/api/endpoints/questions';
import { usePollingApi } from '@/hooks/usePollingApi';
import type { Question, QuestionBank, QuestionStatus, QuestionType, QuestionDifficulty } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

const { Option } = Select;
const { Step } = Steps;

const TYPE_COLORS: Record<QuestionType, string> = {
  MCQ: 'blue', TF: 'cyan', FILL: 'green', MATCH: 'purple', NUMERIC: 'orange', SUBJECTIVE: 'default',
};

const DIFF_COLORS: Record<QuestionDifficulty, string> = {
  EASY: 'green', MEDIUM: 'gold', HARD: 'red',
};

export default function QuestionBanks() {
  const { t } = useTranslation();
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [form] = Form.useForm();

  const { data: banksData, mutate: mutateBanks } = usePollingApi<PaginatedResponse<QuestionBank>>(
    '/api/v1/question-banks', 30_000
  );
  const { data: questionsData, mutate: mutateQ } = usePollingApi<PaginatedResponse<Question>>(
    selectedBank ? `/api/v1/question-banks/${selectedBank.id}/questions` : null, 30_000
  );

  const banks = banksData?.data ?? [];
  const questions = questionsData?.data ?? [];

  const handleStatusTransition = async (q: Question, newStatus: QuestionStatus) => {
    Modal.confirm({
      title: `Move to ${newStatus}?`,
      onOk: async () => {
        await questionsApi.updateStatus(q.id, newStatus);
        message.success('Status updated');
        mutateQ();
      },
    });
  };

  const handleSaveQuestion = async (values: Record<string, unknown>) => {
    try {
      if (editingQuestion) {
        await questionsApi.updateQuestion(editingQuestion.id, values as Partial<Question>);
      } else {
        await questionsApi.createQuestion({ ...values as Partial<Question>, bankId: selectedBank?.id });
      }
      message.success('Question saved');
      mutateQ();
      setQuestionDrawerOpen(false);
    } catch {
      message.error('Save failed');
    }
  };

  const handleImport = async () => {
    if (!importFile || !selectedBank) return;
    try {
      await questionsApi.bulkImport(selectedBank.id, importFile);
      message.success('Import completed');
      mutateQ();
      setImportModalOpen(false);
      setImportStep(0);
    } catch {
      message.error('Import failed');
    }
  };

  const bankColumns = [
    { title: 'Bank Name', dataIndex: 'name', key: 'name',
      render: (v: string, r: QuestionBank) => (
        <Button type="link" onClick={() => setSelectedBank(r)}>{v}</Button>
      )
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
    { title: 'Total Q', dataIndex: 'totalQuestions', key: 'total' },
    { title: 'Live Q', dataIndex: 'liveQuestions', key: 'live' },
    {
      title: t('questions.hoLocked'),
      dataIndex: 'hoLocked',
      key: 'hoLocked',
      render: (v: boolean, r: QuestionBank) => (
        <Button
          size="small"
          icon={v ? <LockOutlined /> : <UnlockOutlined />}
          onClick={async () => {
            await questionsApi.toggleBankLock(r.id, !v);
            mutateBanks();
          }}
        >
          {v ? 'Locked' : 'Unlocked'}
        </Button>
      ),
    },
  ];

  const questionColumns = [
    {
      title: 'Question (EN)',
      dataIndex: 'textEn',
      key: 'textEn',
      render: (v: string, r: Question) => (
        <Button type="link" onClick={() => { setViewingQuestion(r); setShowAnswer(false); setDetailDrawerOpen(true); }}>
          {v.length > 60 ? v.slice(0, 60) + '…' : v}
        </Button>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: QuestionType) => <Tag color={TYPE_COLORS[v]}>{t(`questions.type.${v}`)}</Tag>,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (v: QuestionDifficulty) => <Tag color={DIFF_COLORS[v]}>{t(`questions.difficulty.${v}`)}</Tag>,
    },
    { title: 'Marks', dataIndex: 'marks', key: 'marks', width: 60 },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: QuestionStatus) => <StatusBadge status={v} label={t(`questions.status.${v}`)} />,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: Question) => (
        <Space>
          {r.status === 'DRAFT' && (
            <Button size="small" onClick={() => handleStatusTransition(r, 'REVIEW')}>→ Review</Button>
          )}
          {r.status === 'REVIEW' && (
            <Button size="small" type="primary" onClick={() => handleStatusTransition(r, 'LIVE')}>→ Live</Button>
          )}
          <Button size="small" onClick={() => {
            setEditingQuestion(r);
            form.setFieldsValue(r);
            setQuestionDrawerOpen(true);
          }}>Edit</Button>
          <Button size="small" danger onClick={async () => {
            Modal.confirm({
              title: 'Delete question?',
              onOk: async () => { await questionsApi.deleteQuestion(r.id); mutateQ(); }
            });
          }}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('questions.title')}
        extra={
          selectedBank && (
            <Space>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
                {t('questions.bulkImport')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingQuestion(null);
                form.resetFields();
                setQuestionDrawerOpen(true);
              }}>
                {t('questions.newQuestion')}
              </Button>
            </Space>
          )
        }
      />

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Question Banks" size="small">
            <DataTable<QuestionBank>
              dataSource={banks}
              columns={bankColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={16}>
          {selectedBank ? (
            <Card
              title={`Questions — ${selectedBank.name}`}
              extra={
                selectedBank.hoLocked && (
                  <Tag color="red" icon={<LockOutlined />}>{t('questions.hoLocked')}</Tag>
                )
              }
            >
              <DataTable<Question>
                dataSource={questions}
                columns={questionColumns}
                rowKey="id"
                exportFilename={`questions-${selectedBank.name}`}
                exportColumns={[
                  { key: 'textEn', label: 'Question EN' },
                  { key: 'type', label: 'Type' },
                  { key: 'difficulty', label: 'Difficulty' },
                  { key: 'marks', label: 'Marks' },
                  { key: 'status', label: 'Status' },
                ]}
              />
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-400">
                Select a question bank to view questions
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Question Drawer */}
      <Drawer
        title={editingQuestion ? 'Edit Question' : t('questions.newQuestion')}
        open={questionDrawerOpen}
        onClose={() => setQuestionDrawerOpen(false)}
        width={600}
        extra={<Button type="primary" onClick={() => form.submit()}>Save</Button>}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveQuestion}>
          <Form.Item name="textEn" label="Question Text (EN)" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="textHi" label="Question Text (HI)" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]} initialValue="MCQ">
                <Select>
                  {(['MCQ', 'TF', 'FILL', 'MATCH', 'NUMERIC', 'SUBJECTIVE'] as QuestionType[]).map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="difficulty" label="Difficulty" rules={[{ required: true }]} initialValue="MEDIUM">
                <Select>
                  {(['EASY', 'MEDIUM', 'HARD'] as QuestionDifficulty[]).map((d) => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="marks" label="Marks" rules={[{ required: true }]} initialValue={1}>
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="answerKey" label={t('questions.answerKey')} rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="explanation" label="Explanation">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Question Detail"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={500}
      >
        {viewingQuestion && (
          <div>
            <p><strong>EN:</strong> {viewingQuestion.textEn}</p>
            <p><strong>HI:</strong> {viewingQuestion.textHi}</p>
            <Row gutter={8} className="my-2">
              <Col><Tag color={TYPE_COLORS[viewingQuestion.type]}>{viewingQuestion.type}</Tag></Col>
              <Col><Tag color={DIFF_COLORS[viewingQuestion.difficulty]}>{viewingQuestion.difficulty}</Tag></Col>
              <Col><Tag>{viewingQuestion.marks} marks</Tag></Col>
              <Col><StatusBadge status={viewingQuestion.status} /></Col>
            </Row>
            {viewingQuestion.options?.map((o) => (
              <div key={o.id} style={{ padding: '4px 8px', background: o.isCorrect && showAnswer ? '#f0fdf4' : '#fafafa', marginBottom: 4, borderRadius: 4 }}>
                {o.textEn}
              </div>
            ))}
            <Divider />
            <Button
              icon={showAnswer ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowAnswer(!showAnswer)}
            >
              {showAnswer ? t('questions.hideAnswer') : t('questions.showAnswer')}
            </Button>
            {showAnswer && (
              <Card size="small" style={{ marginTop: 8, background: '#fefce8' }}>
                <strong>{t('questions.answerKey')}:</strong> {viewingQuestion.answerKey}
              </Card>
            )}
            <Divider />
            <p><strong>{t('questions.usageStats')}:</strong> Used in {viewingQuestion.usageCount} exams</p>
          </div>
        )}
      </Drawer>

      {/* Bulk Import Modal */}
      <Modal
        title={t('questions.bulkImport')}
        open={importModalOpen}
        onCancel={() => { setImportModalOpen(false); setImportStep(0); setImportFile(null); }}
        footer={null}
        width={600}
      >
        <Steps current={importStep} className="mb-6">
          <Step title="Upload File" />
          <Step title="Parse Preview" />
          <Step title="Confirm Import" />
        </Steps>
        {importStep === 0 && (
          <div>
            <Upload.Dragger
              accept=".xlsx,.xls,.docx"
              beforeUpload={(file) => { setImportFile(file); return false; }}
              maxCount={1}
            >
              <p>Drop Word/Excel template here or click to upload</p>
            </Upload.Dragger>
            <Button
              type="primary"
              className="mt-4"
              disabled={!importFile}
              onClick={() => setImportStep(1)}
            >
              Next
            </Button>
          </div>
        )}
        {importStep === 1 && (
          <div>
            <p>File ready: {importFile?.name}</p>
            <p className="text-gray-500 text-sm">Parse preview would appear here after server-side parsing.</p>
            <Space>
              <Button onClick={() => setImportStep(0)}>Back</Button>
              <Button type="primary" onClick={() => setImportStep(2)}>Next</Button>
            </Space>
          </div>
        )}
        {importStep === 2 && (
          <div>
            <p>Ready to import. This will add questions to the selected bank.</p>
            <Space>
              <Button onClick={() => setImportStep(1)}>Back</Button>
              <Button type="primary" onClick={handleImport}>Confirm Import</Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
