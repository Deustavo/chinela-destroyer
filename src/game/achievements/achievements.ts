export interface Achievement {
  id: string
  name: string
  description: string
  heightThreshold: number
  unlockedIconKey: string
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'height_100',
    name: 'Alpinista',
    description: 'Alcance altura 100',
    heightThreshold: 100,
    unlockedIconKey: 'achievement-1',
  },
  {
    id: 'height_200',
    name: 'Conquistador do Céu',
    description: 'Alcance altura 200',
    heightThreshold: 200,
    unlockedIconKey: 'achievement-2',
  },
  {
    id: 'height_500',
    name: 'Lenda das Alturas',
    description: 'Alcance altura 500',
    heightThreshold: 500,
    unlockedIconKey: 'achievement-3',
  },
  {
    id: 'height_1000',
    name: 'Mestre das Nuvens',
    description: 'Alcance altura 1000',
    heightThreshold: 1000,
    unlockedIconKey: 'achievement-4',
  },
  {
    id: 'height_2000',
    name: 'Tocar as Estrelas',
    description: 'Alcance altura 2000',
    heightThreshold: 2000,
    unlockedIconKey: 'achievement-5',
  },
  {
    id: 'height_3000',
    name: 'Além dos Céus',
    description: 'Alcance altura 3000',
    heightThreshold: 3000,
    unlockedIconKey: 'achievement-6',
  },
]
