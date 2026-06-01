import { storageGet, storageRemove, storageSet } from './storage'

const KEY = 'newItemNotification'
const ACHIEVEMENT_KEY = 'newAchievementNotification'

export const NotificationManager = {
  setNewItem()  { storageSet(KEY, '1') },
  clearNewItem(){ storageRemove(KEY) },
  hasNewItem()  { return storageGet(KEY) === '1' },

  setNewAchievement()   { storageSet(ACHIEVEMENT_KEY, '1') },
  clearNewAchievement() { storageRemove(ACHIEVEMENT_KEY) },
  hasNewAchievement()   { return storageGet(ACHIEVEMENT_KEY) === '1' },
}
