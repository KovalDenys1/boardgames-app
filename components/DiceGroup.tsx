'use client'

import Dice from './Dice'

interface DiceGroupProps {
  dice: number[]
  held: boolean[]
  onToggleHold: (index: number) => void
  disabled?: boolean
  isRolling?: boolean
}

export default function DiceGroup({ dice, held, onToggleHold, disabled = false, isRolling = false }: DiceGroupProps) {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-center">🎲 Dice</h2>
      
      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {dice.map((value, index) => (
          <Dice
            key={index}
            value={value}
            held={held[index]}
            onToggleHold={() => onToggleHold(index)}
            isRolling={isRolling}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {disabled ? (
          <p>Wait for your turn...</p>
        ) : (
          <p>Click dice to hold them before rolling</p>
        )}
      </div>
    </div>
  )
}
