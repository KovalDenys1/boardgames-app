'use client'

import React, { useState, useCallback } from 'react'
import { ChessPiece, Position, ChessMove, PieceColor } from '@/lib/games/chess-types'

interface ChessBoardProps {
  board: (ChessPiece | null)[][]
  currentPlayer: PieceColor
  selectedSquare?: Position
  possibleMoves?: Position[]
  onSquareClick: (position: Position) => void
  onMove: (move: ChessMove) => void
  disabled?: boolean
  flipped?: boolean // For black player view
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  currentPlayer,
  selectedSquare,
  possibleMoves = [],
  onSquareClick,
  onMove,
  disabled = false,
  flipped = false
}) => {
  const [draggedPiece, setDraggedPiece] = useState<ChessPiece | null>(null)
  const [dragStart, setDragStart] = useState<Position | null>(null)

  const getPieceSymbol = (piece: ChessPiece | null): string => {
    if (!piece) return ''

    const symbols: Record<PieceColor, Record<string, string>> = {
      white: {
        king: '♔',
        queen: '♕',
        rook: '♖',
        bishop: '♗',
        knight: '♘',
        pawn: '♙'
      },
      black: {
        king: '♚',
        queen: '♛',
        rook: '♜',
        bishop: '♝',
        knight: '♞',
        pawn: '♟'
      }
    }

    return symbols[piece.color][piece.type] || ''
  }

  const isLightSquare = (row: number, col: number): boolean => {
    return (row + col) % 2 === 0
  }

  const isSelected = (row: number, col: number): boolean => {
    return selectedSquare?.row === row && selectedSquare?.col === col
  }

  const isPossibleMove = (row: number, col: number): boolean => {
    return possibleMoves.some(move => move.row === row && move.col === col)
  }

  const getSquareClassName = (row: number, col: number): string => {
    const baseClasses = 'w-12 h-12 flex items-center justify-center text-4xl cursor-pointer select-none transition-all duration-200 relative'

    let classes = baseClasses

    if (isLightSquare(row, col)) {
      classes += ' bg-amber-100'
    } else {
      classes += ' bg-amber-800'
    }

    if (isSelected(row, col)) {
      classes += ' ring-4 ring-blue-500 ring-inset'
    }

    if (isPossibleMove(row, col)) {
      if (board[row][col]) {
        classes += ' ring-4 ring-red-500 ring-inset bg-red-200'
      } else {
        classes += ' ring-4 ring-green-500 ring-inset'
        classes += ' after:content-[""] after:absolute after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:opacity-70'
      }
    }

    if (!disabled) {
      classes += ' hover:bg-opacity-70'
    }

    return classes
  }

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (disabled) return

    const position: Position = { row, col }
    onSquareClick(position)
  }, [disabled, onSquareClick])

  const handleDragStart = (e: React.DragEvent, row: number, col: number) => {
    if (disabled) {
      e.preventDefault()
      return
    }

    const piece = board[row][col]
    if (!piece || piece.color !== currentPlayer) {
      e.preventDefault()
      return
    }

    setDraggedPiece(piece)
    setDragStart({ row, col })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault()

    if (!draggedPiece || !dragStart) return

    const to: Position = { row, col }
    const move: ChessMove = {
      from: dragStart,
      to,
      piece: draggedPiece,
      capturedPiece: board[row][col] || undefined
    }

    onMove(move)

    setDraggedPiece(null)
    setDragStart(null)
  }

  const renderBoard = () => {
    const squares = []

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const displayRow = flipped ? 7 - row : row
        const displayCol = flipped ? 7 - col : col
        const piece = board[displayRow][displayCol]

        squares.push(
          <div
            key={`${displayRow}-${displayCol}`}
            className={getSquareClassName(displayRow, displayCol)}
            onClick={() => handleSquareClick(displayRow, displayCol)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, displayRow, displayCol)}
          >
            <div
              draggable={!disabled && piece?.color === currentPlayer}
              onDragStart={(e) => handleDragStart(e, displayRow, displayCol)}
              className="w-full h-full flex items-center justify-center"
            >
              {getPieceSymbol(piece)}
            </div>
          </div>
        )
      }
    }

    return squares
  }

  return (
    <div className="inline-block border-4 border-amber-900 rounded-lg shadow-2xl bg-amber-50">
      <div className="grid grid-cols-8 gap-0">
        {renderBoard()}
      </div>

      {/* File labels (a-h) */}
      <div className="flex justify-around px-3 py-1 text-sm font-bold text-amber-900">
        {flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
          .map(file => (
            <span key={file} className="w-12 text-center">{file}</span>
          ))}
      </div>
    </div>
  )
}

export default ChessBoard