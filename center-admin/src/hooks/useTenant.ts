import { useEffect } from 'react'
import { useTenantStore } from '@/store'
import { settingsApi } from '@/api/endpoints/settings'

export function useTenant() {
  const { center, setCenter } = useTenantStore()

  useEffect(() => {
    if (!center) {
      settingsApi.getCenter().then((res) => {
        if (res.data.data) setCenter(res.data.data)
      }).catch(() => {
        // silently fail if not authenticated yet
      })
    }
  }, [center, setCenter])

  return { center }
}
