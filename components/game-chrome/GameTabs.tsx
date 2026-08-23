'use client'

import React from 'react'

/**
 * Shared mobile in-game tab strip (#736 phase 5) — replaces the duplicated
 * .ttt-tabs (TTT + C4) and .memory-tabs inline markup. Renders segmented
 * buttons with an optional unread badge per tab. Not to be confused with
 * MobileTabs (the bottom navigation bar Yahtzee/Spy use) — that is a
 * different paradigm and stays as is.
 */
export interface GameTab<T extends string> {
  id: T
  label: string
  /** Unread count; badge renders when > 0 and the tab is not active. */
  badge?: number
}

export default function GameTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: ReadonlyArray<GameTab<T>>
  activeTab: T
  onTabChange: (id: T) => void
}) {
  return (
    <div className="game-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`game-tab${activeTab === tab.id ? ' game-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {typeof tab.badge === 'number' && tab.badge > 0 && activeTab !== tab.id && (
            <span className="game-tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}
