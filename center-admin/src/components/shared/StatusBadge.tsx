import { Tag } from 'antd'

type Status =
  | 'active' | 'completed' | 'dropped' | 'on_hold'
  | 'pending' | 'paid' | 'overdue' | 'waived'
  | 'not_requested' | 'issued'
  | 'new' | 'contacted' | 'visited' | 'admitted' | 'lost'
  | 'upcoming' | 'approved' | 'rejected' | 'submitted'
  | 'in_progress' | 'not_started' | 'flagged' | 'cancelled'

const colorMap: Record<string, string> = {
  active: 'green',
  completed: 'blue',
  dropped: 'default',
  on_hold: 'orange',
  pending: 'gold',
  paid: 'green',
  overdue: 'red',
  waived: 'purple',
  not_requested: 'default',
  issued: 'blue',
  new: 'blue',
  contacted: 'orange',
  visited: 'cyan',
  admitted: 'green',
  lost: 'default',
  upcoming: 'cyan',
  approved: 'green',
  rejected: 'red',
  submitted: 'gold',
  in_progress: 'processing',
  not_started: 'default',
  flagged: 'red',
  cancelled: 'default',
}

const labelMap: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  dropped: 'Dropped',
  on_hold: 'On Hold',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  waived: 'Waived',
  not_requested: 'Not Requested',
  issued: 'Issued',
  new: 'New',
  contacted: 'Contacted',
  visited: 'Visited',
  admitted: 'Admitted',
  lost: 'Lost',
  upcoming: 'Upcoming',
  approved: 'Approved',
  rejected: 'Rejected',
  submitted: 'Submitted',
  in_progress: 'In Progress',
  not_started: 'Not Started',
  flagged: 'Flagged',
  cancelled: 'Cancelled',
}

interface Props {
  status: Status | string
}

export function StatusBadge({ status }: Props) {
  return (
    <Tag color={colorMap[status] ?? 'default'}>
      {labelMap[status] ?? status}
    </Tag>
  )
}
