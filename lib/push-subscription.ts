function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPushPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration()
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) return null

  // Request permission before anything else that could await (including
  // service-worker readiness, which can take a real amount of time on a
  // first visit). Browsers require Notification.requestPermission() to run
  // close to the triggering user gesture — an async gap beforehand can
  // cause it to hang or silently no-op instead of showing the prompt.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const reg = await getRegistration()
  if (!reg) return null

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const sub = await getExistingPushSubscription()
  if (!sub) return true
  return sub.unsubscribe()
}
