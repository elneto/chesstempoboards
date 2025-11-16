let game = new Chess();
let board = null;
let flipped = false;
let startingFEN = "";
let ignoreMoveUpdate = false;

function loadFEN() {
  startingFEN = document
    .getElementById("fenInput")
    .value.trim()
    .replace(/.$/, "1");
  if (!game.load(startingFEN)) {
    alert("Invalid FEN");
    return;
  }
  board.position(startingFEN);
  updateMoves();
}

function flipBoard() {
  flipped = !flipped;
  board.flip();
  updateMoves();
}

function updateMoves() {
  if (ignoreMoveUpdate) return;

  const moves = game.history({ verbose: true });
  let movesText = "";

  // Determine starting move number and whose turn it is from FEN
  const fenParts = startingFEN.split(" ");
  const startFullmove = parseInt(fenParts[5]) || 1;
  const startTurn = fenParts[1]; // 'w' or 'b'

  let moveNumber = startFullmove;
  let isWhiteTurn = startTurn === "w";

  for (let i = 0; i < moves.length; i++) {
    if (isWhiteTurn) {
      // White's turn - format: "1.e4"
      movesText += `${moveNumber}.${moves[i].san} `;
      isWhiteTurn = false;
    } else {
      // Black's turn - format: "1...e5"
      movesText += `${moveNumber}...${moves[i].san} `;
      moveNumber++;
      isWhiteTurn = true;
    }
  }

  const tag = `[moves ${flipped ? "flip=true" : ""} start=${startingFEN}]`;
  document.getElementById("movesText").value = movesText.trim();
  document.getElementById(
    "output"
  ).value = `${tag}${movesText.trim()} [/moves]`;
}

function parseMovesFromText() {
  const movesText = document.getElementById("movesText").value.trim();
  if (!movesText) return;

  ignoreMoveUpdate = true;

  try {
    // Reset game to starting position
    const tempGame = new Chess();
    tempGame.load(startingFEN);

    // Parse moves from text
    const tokens = movesText.split(/\s+/);

    // Determine starting move info from FEN
    const fenParts = startingFEN.split(" ");
    let currentMoveNumber = parseInt(fenParts[5]) || 1;
    let expectingWhiteMove = fenParts[1] === "w";

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (!token) continue;

      // Handle move numbers with dots (e.g., "1.", "2.")
      const moveNumberMatch = token.match(/^(\d+)\.$/);
      if (moveNumberMatch) {
        currentMoveNumber = parseInt(moveNumberMatch[1]);
        expectingWhiteMove = true;
        continue;
      }

      // Handle black moves with ellipsis (e.g., "1...e5")
      const blackMoveMatch = token.match(/^(\d+)\.\.\.(.+)$/);
      if (blackMoveMatch) {
        currentMoveNumber = parseInt(blackMoveMatch[1]);
        const blackMove = blackMoveMatch[2];
        const move = tempGame.move(blackMove, { sloppy: true });
        if (!move) {
          throw new Error(`Invalid black move: ${blackMove}`);
        }
        expectingWhiteMove = true;
        continue;
      }

      // Handle moves that combine number and move without space (e.g., "1.Kc5")
      const combinedMoveMatch = token.match(/^(\d+)\.(.+)$/);
      if (combinedMoveMatch) {
        currentMoveNumber = parseInt(combinedMoveMatch[1]);
        const whiteMove = combinedMoveMatch[2];
        const move = tempGame.move(whiteMove, { sloppy: true });
        if (!move) {
          throw new Error(`Invalid white move: ${whiteMove}`);
        }
        expectingWhiteMove = false;
        continue;
      }

      // Regular move (no number attached)
      const move = tempGame.move(token, { sloppy: true });
      if (!move) {
        throw new Error(`Invalid move: ${token}`);
      }

      // Update move tracking
      if (expectingWhiteMove) {
        expectingWhiteMove = false;
      } else {
        currentMoveNumber++;
        expectingWhiteMove = true;
      }
    }

    // If all moves are valid, update the main game and board
    game = tempGame;
    board.position(game.fen());
    updateOutput();
  } catch (error) {
    console.error("Error parsing moves:", error);
  } finally {
    ignoreMoveUpdate = false;
  }
}

function updateOutput() {
  const movesText = document.getElementById("movesText").value.trim();
  const tag = `[moves ${flipped ? "flip=true" : ""} start=${startingFEN}]`;
  document.getElementById("output").value = `${tag}${movesText} [/moves]`;
}

function copyComment() {
  const out = document.getElementById("output");
  out.select();
  document.execCommand("copy");
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: "q" });
  if (!move) return "snapback";
  updateMoves();
}

function onSnapEnd() {
  board.position(game.fen());
}

document.addEventListener("DOMContentLoaded", () => {
  board = Chessboard("board", {
    draggable: true,
    position: "start",
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,

    // Mobile-friendly settings
    pieceTheme: undefined,
    moveSpeed: 0,
    snapBackSpeed: 0,
    snapSpeed: 0,
    appearSpeed: 0,
    // Allow tapping instead of drag
    sparePieces: false,
  });

  // Initialize with standard starting position
  startingFEN = game.fen();
  updateMoves();

  // Add event listener for moves textarea changes
  document
    .getElementById("movesText")
    .addEventListener("input", parseMovesFromText);
  document
    .getElementById("movesText")
    .addEventListener("blur", parseMovesFromText);
});
