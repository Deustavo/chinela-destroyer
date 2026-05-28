const KEY = 'newItemNotification'

export const NotificationManager = {
  setNewItem()  { localStorage.setItem(KEY, '1') },
  clearNewItem(){ localStorage.removeItem(KEY) },
  hasNewItem()  { return localStorage.getItem(KEY) === '1' },
}
