import { ACHIEVEMENTS } from './achievements'
import type { Achievement } from './achievements'

const STORAGE_KEY = 'unlockedAchievements'

export class AchievementManager {
  static getUnlocked(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return new Set(raw ? JSON.parse(raw) : [])
    } catch {
      return new Set()
    }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]))
    }

    return newlyUnlocked
  }

  static getAll(): Achievement[] {
    return ACHIEVEMENTS
  }
}
