import {
  recordNotificationDelivery,
  hasRecentSentNotification,
} from '@/lib/notifications-log'
import { prisma } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  prisma: {
    notifications: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

const mockNotifications = prisma.notifications as unknown as {
  create: jest.Mock
  findFirst: jest.Mock
}

describe('notifications-log channel handling (#256)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNotifications.create.mockResolvedValue({})
    mockNotifications.findFirst.mockResolvedValue(null)
  })

  it('recordNotificationDelivery defaults to the email channel', async () => {
    await recordNotificationDelivery({
      userId: 'user-1',
      type: 'turn_reminder',
      status: 'sent',
    })

    expect(mockNotifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: 'email' }) })
    )
  })

  it('recordNotificationDelivery honors an explicit push channel', async () => {
    await recordNotificationDelivery({
      userId: 'user-1',
      type: 'turn_reminder',
      status: 'sent',
      channel: 'push',
    })

    expect(mockNotifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ channel: 'push' }) })
    )
  })

  it('hasRecentSentNotification queries the push channel separately from email', async () => {
    await hasRecentSentNotification({
      userId: 'user-1',
      type: 'turn_reminder',
      channel: 'push',
      since: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(mockNotifications.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ channel: 'push' }) })
    )
  })
})
