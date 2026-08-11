import { Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useState } from 'react'

interface Props {
  onExport: () => Promise<Blob> | Blob
  filename?: string
  label?: string
  disabled?: boolean
}

export function ExportButton({ onExport, filename = 'export.csv', label = 'Export CSV', disabled }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const blob = await onExport()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleExport}
      loading={loading}
      disabled={disabled}
    >
      {label}
    </Button>
  )
}
