class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSounds()
      const saved = localStorage.getItem('soundEnabled')
      this.enabled = saved !== 'false'
    }
  }

  private loadSounds() {
    const soundFiles = {
      diceRoll: '/sounds/dice-roll.mp3',
      click: '/sounds/click.mp3',
      win: '/sounds/win.mp3',
      turnChange: '/sounds/turn-change.mp3',
      score: '/sounds/score.mp3',
    }

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path)
      audio.preload = 'auto'
      this.sounds.set(key, audio)
    })
  }

  play(soundName: string) {
    if (!this.enabled) return

    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((err) => {
        console.warn('Sound play failed:', err)
      })
    }
  }

  toggle() {
    this.enabled = !this.enabled
    localStorage.setItem('soundEnabled', String(this.enabled))
    return this.enabled
  }

  isEnabled() {
    return this.enabled
  }
}

export const soundManager = new SoundManager()
