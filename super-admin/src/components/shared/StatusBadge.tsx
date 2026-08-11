import React from 'react';
import { Tag } from 'antd';
import type { CenterStatus, QuestionStatus, ExamStatus, CertificateStatus, MetaApprovalStatus } from '@/types/models';

type StatusValue =
  | CenterStatus
  | QuestionStatus
  | ExamStatus
  | CertificateStatus
  | MetaApprovalStatus
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'OK'
  | 'WARNING'
  | 'ERROR'
  | string;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'green',
  PROSPECT: 'blue',
  FROZEN: 'orange',
  CLOSED: 'default',
  DRAFT: 'default',
  REVIEW: 'gold',
  LIVE: 'green',
  SCHEDULED: 'blue',
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  ISSUED: 'green',
  REVOKED: 'red',
  PROCESSED: 'green',
  FAILED: 'red',
  OK: 'green',
  WARNING: 'orange',
  ERROR: 'red',
  INACTIVE: 'default',
};

interface StatusBadgeProps {
  status: StatusValue;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const color = STATUS_COLORS[status] ?? 'default';
  return <Tag color={color}>{label ?? status}</Tag>;
};
