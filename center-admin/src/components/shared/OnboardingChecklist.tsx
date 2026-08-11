import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import { Progress } from 'antd'
import { useTenantStore } from '@/store'
import { useTranslation } from 'react-i18next'

export function OnboardingChecklist() {
  const { center } = useTenantStore()
  const { t } = useTranslation()

  if (!center) return null

  const { onboardingChecklist: cl } = center
  const items = [
    { key: 'profileComplete', label: t('onboarding.profile'), done: cl.profileComplete },
    { key: 'coursesAdded', label: t('onboarding.courses'), done: cl.coursesAdded },
    { key: 'feePlansAdded', label: t('onboarding.feePlans'), done: cl.feePlansAdded },
    { key: 'firstAdmissionDone', label: t('onboarding.firstAdmission'), done: cl.firstAdmissionDone },
  ]

  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <div className="mx-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="text-xs font-semibold text-blue-700 mb-2">{t('onboarding.title')}</div>
      <Progress
        percent={Math.round((doneCount / items.length) * 100)}
        size="small"
        className="mb-2"
      />
      <ul className="list-none m-0 p-0 space-y-1">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <CheckCircleFilled className="text-green-500" />
            ) : (
              <ClockCircleOutlined className="text-gray-400" />
            )}
            <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-700'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
