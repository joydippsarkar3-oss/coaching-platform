import { Card, Statistic } from 'antd'
import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  prefix?: ReactNode
  suffix?: string
  valueStyle?: React.CSSProperties
  loading?: boolean
  extra?: ReactNode
}

export function StatCard({ title, value, prefix, suffix, valueStyle, loading, extra }: Props) {
  return (
    <Card loading={loading} extra={extra} className="h-full">
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle}
      />
    </Card>
  )
}
