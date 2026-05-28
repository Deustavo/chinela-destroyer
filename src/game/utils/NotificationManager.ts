import { storageGet, storageRemove, storageSet } from './storage'

const KEY = 'newItemNotification'

export const NotificationManager = {
  setNewItem()  { storageSet(KEY, '1') },
  clearNewItem(){ storageRemove(KEY) },
  hasNewItem()  { return storageGet(KEY) === '1' },
}
