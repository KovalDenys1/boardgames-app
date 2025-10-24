// Chess Types and Interfaces
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
export type PieceColor = 'white' | 'black'

export interface ChessPiece {
  type: PieceType
  color: PieceColor
  hasMoved?: boolean // For castling and pawn double-move rules
}

export interface Position {
  row: number // 0-7 (0 = 8th rank, 7 = 1st rank)
  col: number // 0-7 (0 = a-file, 7 = h-file)
}

export interface ChessMove {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isEnPassant?: boolean
  isCastling?: boolean
  promotion?: PieceType
  notation?: string // Algebraic notation
}

export interface ChessBoard {
  pieces: (ChessPiece | null)[][]
  enPassantTarget?: Position
  castlingRights: {
    whiteKingSide: boolean
    whiteQueenSide: boolean
    blackKingSide: boolean
    blackQueenSide: boolean
  }
}

export interface ChessGameData {
  board: ChessBoard
  currentPlayer: PieceColor
  moveHistory: ChessMove[]
  halfMoveClock: number // For 50-move rule
  fullMoveNumber: number
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'
  winner?: PieceColor
}

// Utility functions
export function positionToString(pos: Position): string {
  return String.fromCharCode(97 + pos.col) + (8 - pos.row).toString()
}

export function stringToPosition(str: string): Position {
  return {
    col: str.charCodeAt(0) - 97,
    row: 8 - parseInt(str[1])
  }
}

export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7
}

export function createInitialBoard(): ChessBoard {
  const board: ChessBoard = {
    pieces: Array(8).fill(null).map(() => Array(8).fill(null)),
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true
    }
  }

  // Place pawns
  for (let col = 0; col < 8; col++) {
    board.pieces[1][col] = { type: 'pawn', color: 'black' }
    board.pieces[6][col] = { type: 'pawn', color: 'white' }
  }

  // Place other pieces
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

  for (let col = 0; col < 8; col++) {
    board.pieces[0][col] = { type: pieceOrder[col], color: 'black' }
    board.pieces[7][col] = { type: pieceOrder[col], color: 'white' }
  }

  return board
}