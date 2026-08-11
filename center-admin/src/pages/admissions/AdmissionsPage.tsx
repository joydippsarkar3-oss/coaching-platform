import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { NewAdmissionWizard } from './NewAdmissionWizard'

export function AdmissionsPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="New Admission"
        subtitle="Enrol a student in 5 simple steps"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>
            Start Admission
          </Button>
        }
      />

      <div className="bg-white rounded-lg p-8 text-center text-gray-400">
        <p className="mb-4">Click "Start Admission" to launch the admission wizard.</p>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>
          Start Admission
        </Button>
      </div>

      <NewAdmissionWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => { setWizardOpen(false) }}
      />
    </div>
  )
}
