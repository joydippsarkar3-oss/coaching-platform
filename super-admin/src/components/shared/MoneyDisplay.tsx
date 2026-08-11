import React from 'react';
import { Tooltip } from 'antd';
import { formatMoney, formatMoneyCompact } from '@/utils/money';

interface MoneyDisplayProps {
  paise: number;
  compact?: boolean;
  className?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ paise, compact = false, className }) => {
  const display = compact ? formatMoneyCompact(paise) : formatMoney(paise);
  const full = formatMoney(paise);

  if (compact && display !== full) {
    return (
      <Tooltip title={full}>
        <span className={className}>{display}</span>
      </Tooltip>
    );
  }

  return <span className={className}>{display}</span>;
};
