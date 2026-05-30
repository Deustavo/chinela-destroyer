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
    name: 'Primeiros pulos',
    description: 'Alcance altura 100',
    heightThreshold: 100,
    unlockedIconKey: 'achievement-1',
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
    name: 'Mestre do espaço',
    description: 'Derrote a nave mãe e alcance altura 1000',
    heightThreshold: 1000,
    unlockedIconKey: 'achievement-4',
  },
  {
    id: 'height_2000',
    name: 'Tocar as Estrelas',
    description: 'Derrote a nave mãe duas vezes e alcance altura 2000',
    heightThreshold: 2000,
    unlockedIconKey: 'achievement-5',
  },
  {
    id: 'height_3000',
    name: 'Além dos Céus',
    description: 'Vença todas as nave mães e alcance altura 3000',
    heightThreshold: 3000,
    unlockedIconKey: 'achievement-6',
  },
]
