import { GameEngine, Player, Move, GameConfig } from '../game-engine'
import {
  ChessGameData,
  ChessBoard,
  ChessPiece,
  ChessMove,
  Position,
  PieceColor,
  PieceType,
  createInitialBoard,
  isValidPosition,
  positionToString
} from './chess-types'

export class ChessGame extends GameEngine {
  constructor(gameId: string, config: GameConfig = { maxPlayers: 2, minPlayers: 2 }) {
    super(gameId, 'chess', config)
  }

  getInitialGameData(): ChessGameData {
    return {
      board: createInitialBoard(),
      currentPlayer: 'white',
      moveHistory: [],
      halfMoveClock: 0,
      fullMoveNumber: 1,
      gameStatus: 'playing'
    }
  }

  validateMove(move: Move): boolean {
    const gameData = this.state.data as ChessGameData

    if (gameData.gameStatus !== 'playing') {
      return false
    }

    // Parse the move data
    const { from, to } = move.data as { from: Position; to: Position }

    if (!isValidPosition(from) || !isValidPosition(to)) {
      return false
    }

    const piece = gameData.board.pieces[from.row][from.col]
    if (!piece || piece.color !== gameData.currentPlayer) {
      return false
    }

    // Check if the move is valid for this piece type
    return this.isValidPieceMove(piece, from, to, gameData.board)
  }

  processMove(move: Move): void {
    const gameData = this.state.data as ChessGameData
    const { from, to, promotion } = move.data as { from: Position; to: Position; promotion?: PieceType }

    const piece = gameData.board.pieces[from.row][from.col]!
    const capturedPiece = gameData.board.pieces[to.row][to.col]

    // Create move record
    const chessMove: ChessMove = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: capturedPiece || undefined,
      notation: this.generateMoveNotation(piece, from, to, capturedPiece !== null)
    }

    // Handle special moves
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      // Double pawn move - set en passant target
      gameData.board.enPassantTarget = { row: (from.row + to.row) / 2, col: to.col }
    } else {
      gameData.board.enPassantTarget = undefined
    }

    // Handle en passant capture
    if (piece.type === 'pawn' && to.col !== from.col && !capturedPiece) {
      // En passant capture
      const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1
      gameData.board.pieces[captureRow][to.col] = null
      chessMove.isEnPassant = true
    }

    // Handle castling
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      // Castling move
      const isKingSide = to.col > from.col
      const rookFromCol = isKingSide ? 7 : 0
      const rookToCol = isKingSide ? 5 : 3

      // Move rook
      const rook = gameData.board.pieces[from.row][rookFromCol]!
      gameData.board.pieces[from.row][rookToCol] = rook
      gameData.board.pieces[from.row][rookFromCol] = null
      rook.hasMoved = true

      chessMove.isCastling = true
      gameData.board.castlingRights[`${piece.color}KingSide` as keyof typeof gameData.board.castlingRights] = false
      gameData.board.castlingRights[`${piece.color}QueenSide` as keyof typeof gameData.board.castlingRights] = false
    }

    // Handle promotion
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      piece.type = promotion || 'queen'
      chessMove.promotion = piece.type
    }

    // Move the piece
    gameData.board.pieces[to.row][to.col] = piece
    gameData.board.pieces[from.row][from.col] = null
    piece.hasMoved = true

    // Update castling rights
    if (piece.type === 'king') {
      gameData.board.castlingRights[`${piece.color}KingSide` as keyof typeof gameData.board.castlingRights] = false
      gameData.board.castlingRights[`${piece.color}QueenSide` as keyof typeof gameData.board.castlingRights] = false
    } else if (piece.type === 'rook') {
      if (from.col === 0) {
        gameData.board.castlingRights[`${piece.color}QueenSide` as keyof typeof gameData.board.castlingRights] = false
      } else if (from.col === 7) {
        gameData.board.castlingRights[`${piece.color}KingSide` as keyof typeof gameData.board.castlingRights] = false
      }
    }

    // Update game state
    gameData.moveHistory.push(chessMove)
    gameData.currentPlayer = gameData.currentPlayer === 'white' ? 'black' : 'white'
    gameData.halfMoveClock = (capturedPiece || piece.type === 'pawn') ? 0 : gameData.halfMoveClock + 1
    gameData.fullMoveNumber += gameData.currentPlayer === 'white' ? 1 : 0

    // Check for check/checkmate/stalemate
    this.updateGameStatus()
  }

  checkWinCondition(): Player | null {
    const gameData = this.state.data as ChessGameData

    if (gameData.gameStatus === 'checkmate') {
      const winnerColor = gameData.currentPlayer === 'white' ? 'black' : 'white'
      return this.state.players.find(p => p.id === (winnerColor === 'white' ? this.state.players[0]?.id : this.state.players[1]?.id)) || null
    }

    return null
  }

  getGameRules(): string[] {
    return [
      'White moves first, then players alternate turns',
      'Each piece moves according to its specific rules',
      'The game ends when a king is checkmated',
      'A king is in check when attacked by an enemy piece',
      'Checkmate occurs when the king is in check and cannot escape',
      'Stalemate occurs when a player has no legal moves but is not in check',
      'Castling allows king to move two squares with rook',
      'En passant allows capturing a pawn that moved two squares',
      'Pawns can promote to any piece when reaching the 8th rank'
    ]
  }

  // Chess-specific methods
  private isValidPieceMove(piece: ChessPiece, from: Position, to: Position, board: ChessBoard): boolean {
    if (from.row === to.row && from.col === to.col) {
      return false // Same position
    }

    const deltaRow = to.row - from.row
    const deltaCol = to.col - from.col

    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(piece, from, to, board, deltaRow, deltaCol)
      case 'rook':
        return this.isValidRookMove(from, to, board, deltaRow, deltaCol)
      case 'knight':
        return this.isValidKnightMove(deltaRow, deltaCol)
      case 'bishop':
        return this.isValidBishopMove(from, to, board, deltaRow, deltaCol)
      case 'queen':
        return this.isValidQueenMove(from, to, board, deltaRow, deltaCol)
      case 'king':
        return this.isValidKingMove(piece, from, to, board, deltaRow, deltaCol)
      default:
        return false
    }
  }

  private isValidPawnMove(piece: ChessPiece, from: Position, to: Position, board: ChessBoard, deltaRow: number, deltaCol: number): boolean {
    const direction = piece.color === 'white' ? -1 : 1
    const startRow = piece.color === 'white' ? 6 : 1

    // Forward move
    if (deltaCol === 0) {
      if (deltaRow === direction && !board.pieces[to.row][to.col]) {
        return true // Single move forward
      }
      if (deltaRow === 2 * direction && from.row === startRow && !board.pieces[to.row][to.col] && !board.pieces[from.row + direction][from.col]) {
        return true // Double move from starting position
      }
    }

    // Capture move
    if (Math.abs(deltaCol) === 1 && deltaRow === direction) {
      const targetPiece = board.pieces[to.row][to.col]
      if (targetPiece && targetPiece.color !== piece.color) {
        return true // Regular capture
      }

      // En passant
      if (board.enPassantTarget && board.enPassantTarget.row === to.row && board.enPassantTarget.col === to.col) {
        return true
      }
    }

    return false
  }

  private isValidRookMove(from: Position, to: Position, board: ChessBoard, deltaRow: number, deltaCol: number): boolean {
    if (deltaRow !== 0 && deltaCol !== 0) return false // Must move in straight line

    const stepRow = deltaRow === 0 ? 0 : deltaRow > 0 ? 1 : -1
    const stepCol = deltaCol === 0 ? 0 : deltaCol > 0 ? 1 : -1

    // Check path is clear
    let currentRow = from.row + stepRow
    let currentCol = from.col + stepCol

    while (currentRow !== to.row || currentCol !== to.col) {
      if (board.pieces[currentRow][currentCol]) {
        return false // Path blocked
      }
      currentRow += stepRow
      currentCol += stepCol
    }

    // Check destination
    const targetPiece = board.pieces[to.row][to.col]
    return !targetPiece || targetPiece.color !== board.pieces[from.row][from.col]!.color
  }

  private isValidKnightMove(deltaRow: number, deltaCol: number): boolean {
    return (Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) ||
           (Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2)
  }

  private isValidBishopMove(from: Position, to: Position, board: ChessBoard, deltaRow: number, deltaCol: number): boolean {
    if (Math.abs(deltaRow) !== Math.abs(deltaCol)) return false // Must move diagonally

    const stepRow = deltaRow > 0 ? 1 : -1
    const stepCol = deltaCol > 0 ? 1 : -1

    // Check path is clear
    let currentRow = from.row + stepRow
    let currentCol = from.col + stepCol

    while (currentRow !== to.row) {
      if (board.pieces[currentRow][currentCol]) {
        return false // Path blocked
      }
      currentRow += stepRow
      currentCol += stepCol
    }

    // Check destination
    const targetPiece = board.pieces[to.row][to.col]
    return !targetPiece || targetPiece.color !== board.pieces[from.row][from.col]!.color
  }

  private isValidQueenMove(from: Position, to: Position, board: ChessBoard, deltaRow: number, deltaCol: number): boolean {
    // Queen combines rook and bishop moves
    return this.isValidRookMove(from, to, board, deltaRow, deltaCol) ||
           this.isValidBishopMove(from, to, board, deltaRow, deltaCol)
  }

  private isValidKingMove(piece: ChessPiece, from: Position, to: Position, board: ChessBoard, deltaRow: number, deltaCol: number): boolean {
    // Normal king move
    if (Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1) {
      const targetPiece = board.pieces[to.row][to.col]
      return !targetPiece || targetPiece.color !== piece.color
    }

    // Castling
    if (deltaRow === 0 && Math.abs(deltaCol) === 2 && !piece.hasMoved) {
      const isKingSide = deltaCol > 0
      const rookCol = isKingSide ? 7 : 0
      const rook = board.pieces[from.row][rookCol]

      if (!rook || rook.type !== 'rook' || rook.hasMoved || rook.color !== piece.color) {
        return false
      }

      // Check castling rights
      const castlingRight = isKingSide ? `${piece.color}KingSide` : `${piece.color}QueenSide`
      if (!board.castlingRights[castlingRight as keyof typeof board.castlingRights]) {
        return false
      }

      // Check path is clear
      const step = isKingSide ? 1 : -1
      for (let col = from.col + step; col !== rookCol; col += step) {
        if (board.pieces[from.row][col]) {
          return false
        }
      }

      return true
    }

    return false
  }

  private updateGameStatus(): void {
    const gameData = this.state.data as ChessGameData

    if (this.isInCheck(gameData.currentPlayer, gameData.board)) {
      if (this.hasLegalMoves(gameData.currentPlayer, gameData.board)) {
        gameData.gameStatus = 'check'
      } else {
        gameData.gameStatus = 'checkmate'
        gameData.winner = gameData.currentPlayer === 'white' ? 'black' : 'white'
      }
    } else {
      if (this.hasLegalMoves(gameData.currentPlayer, gameData.board)) {
        gameData.gameStatus = 'playing'
      } else {
        gameData.gameStatus = 'stalemate'
      }
    }

    // Check for draw conditions
    if (gameData.halfMoveClock >= 100) {
      gameData.gameStatus = 'draw'
    }
  }

  private isInCheck(color: PieceColor, board: ChessBoard): boolean {
    // Find king position
    let kingPos: Position | null = null
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.pieces[row][col]
        if (piece && piece.type === 'king' && piece.color === color) {
          kingPos = { row, col }
          break
        }
      }
      if (kingPos) break
    }

    if (!kingPos) return false

    // Check if any enemy piece can attack the king
    const enemyColor = color === 'white' ? 'black' : 'white'
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board.pieces[row][col]
        if (piece && piece.color === enemyColor) {
          if (this.canPieceAttack(piece, { row, col }, kingPos, board)) {
            return true
          }
        }
      }
    }

    return false
  }

  private canPieceAttack(piece: ChessPiece, from: Position, to: Position, board: ChessBoard): boolean {
    // Simplified attack check (doesn't consider check rules)
    const deltaRow = to.row - from.row
    const deltaCol = to.col - from.col

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1
        return Math.abs(deltaCol) === 1 && deltaRow === direction
      case 'rook':
        return this.isValidRookMove(from, to, board, deltaRow, deltaCol)
      case 'knight':
        return this.isValidKnightMove(deltaRow, deltaCol)
      case 'bishop':
        return this.isValidBishopMove(from, to, board, deltaRow, deltaCol)
      case 'queen':
        return this.isValidQueenMove(from, to, board, deltaRow, deltaCol)
      case 'king':
        return Math.abs(deltaRow) <= 1 && Math.abs(deltaCol) <= 1
      default:
        return false
    }
  }

  private hasLegalMoves(color: PieceColor, board: ChessBoard): boolean {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = board.pieces[fromRow][fromCol]
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (this.isValidPieceMove(piece, { row: fromRow, col: fromCol }, { row: toRow, col: toCol }, board)) {
                // Try the move and see if it gets out of check
                const originalPiece = board.pieces[toRow][toCol]
                board.pieces[toRow][toCol] = piece
                board.pieces[fromRow][fromCol] = null

                const stillInCheck = this.isInCheck(color, board)

                // Undo the move
                board.pieces[fromRow][fromCol] = piece
                board.pieces[toRow][toCol] = originalPiece

                if (!stillInCheck) {
                  return true
                }
              }
            }
          }
        }
      }
    }
    return false
  }

  private generateMoveNotation(piece: ChessPiece, from: Position, to: Position, isCapture: boolean): string {
    const pieceSymbol = piece.type === 'pawn' ? '' : piece.type.charAt(0).toUpperCase()
    const captureSymbol = isCapture ? 'x' : ''
    const toSquare = positionToString(to)

    return `${pieceSymbol}${captureSymbol}${toSquare}`
  }

  // Public methods for UI
  getBoard(): ChessBoard {
    return (this.state.data as ChessGameData).board
  }

  getCurrentPlayerColor(): PieceColor {
    return (this.state.data as ChessGameData).currentPlayer
  }

  getGameStatus(): string {
    return (this.state.data as ChessGameData).gameStatus
  }

  getMoveHistory(): ChessMove[] {
    return [...(this.state.data as ChessGameData).moveHistory]
  }

  getFullMoveNumber(): number {
    return (this.state.data as ChessGameData).fullMoveNumber
  }

  getPossibleMoves(position: Position): Position[] {
    const board = (this.state.data as ChessGameData).board
    const piece = board.pieces[position.row][position.col]

    if (!piece || piece.color !== (this.state.data as ChessGameData).currentPlayer) {
      return []
    }

    const possibleMoves: Position[] = []

    // Check all squares on the board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = { row, col }
        if (this.isValidPieceMove(piece, position, to, board)) {
          // Check if this move would leave the king in check
          const originalPiece = board.pieces[to.row][to.col]
          board.pieces[to.row][to.col] = piece
          board.pieces[position.row][position.col] = null

          const stillInCheck = this.isInCheck(piece.color, board)

          // Undo the move
          board.pieces[position.row][position.col] = piece
          board.pieces[to.row][to.col] = originalPiece

          if (!stillInCheck) {
            possibleMoves.push(to)
          }
        }
      }
    }

    return possibleMoves
  }
}