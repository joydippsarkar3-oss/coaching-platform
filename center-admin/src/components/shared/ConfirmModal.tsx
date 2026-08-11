import { Modal } from 'antd'
import type { ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  content?: ReactNode
  okText?: string
  cancelText?: string
  okType?: 'danger' | 'primary'
  onOk: () => void | Promise<void>
}

export function confirmAction({
  title,
  content,
  okText = 'Confirm',
  cancelText = 'Cancel',
  okType = 'primary',
  onOk,
}: ConfirmOptions) {
  Modal.confirm({
    title,
    content,
    okText,
    cancelText,
    okType: okType === 'danger' ? 'primary' : okType,
    okButtonProps: okType === 'danger' ? { danger: true } : {},
    onOk,
    centered: true,
  })
}
