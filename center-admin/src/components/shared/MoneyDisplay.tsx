import { formatMoney } from '@/utils/money'

interface Props {
  paise: number
  className?: string
  /** render as plain text span (default) or a styled green amount */
  variant?: 'default' | 'success' | 'danger'
}

const variantClass: Record<string, string> = {
  default: '',
  success: 'text-green-600 font-medium',
  danger: 'text-red-500 font-medium',
}

export function MoneyDisplay({ paise, className = '', variant = 'default' }: Props) {
  return (
    <span className={`font-mono ${variantClass[variant]} ${className}`}>
      {formatMoney(paise)}
    </span>
  )
}
