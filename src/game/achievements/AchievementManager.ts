import { ACHIEVEMENTS } from './achievements'
import type { Achievement } from './achievements'
import { storageGet, storageSet, parseJson } from '../utils/storage'
import { NotificationManager } from '../utils/NotificationManager'

const STORAGE_KEY = 'unlockedAchievements'

export class AchievementManager {
  static getUnlocked(): Set<string> {
    return new Set(parseJson<string[]>(storageGet(STORAGE_KEY), []))
  }

  static isUnlocked(id: string): boolean {
    return this.getUnlocked().has(id)
  }

  /** Check height against all achievements, persist new unlocks, return newly unlocked list. */
  static checkHeight(height: number): Achievement[] {
    const unlocked = this.getUnlocked()
    const newlyUnlocked: Achievement[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (!unlocked.has(achievement.id) && height >= achievement.heightThreshold) {
        unlocked.add(achievement.id)
        newlyUnlocked.push(achievement)
      }
    }

    if (newlyUnlocked.length > 0) {
      storageSet(STORAGE_KEY, JSON.stringify([...unlocked]))
      NotificationManager.setNewAchievement()
    }

    return newlyUnlocked
  }

  static getAll(): Achievement[] {
    return ACHIEVEMENTS
  }
}
