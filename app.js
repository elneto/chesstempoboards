let game = new Chess();
let board = null;
let flipped = false;
let startingFEN = "";
let ignoreMoveUpdate = false;
let moveHistory = []; // Store positions for navigation

function loadFEN() {
  startingFEN = document
    .getElementById("fenInput")
    .value.trim()
    .replace(/.$/, "1");
  if (!game.load(startingFEN)) {
    alert("Invalid FEN");
    return;
  }
  board.position(game.fen());
  updateMoveHistory();
  updateMoves();
}

function flipBoard() {
  flipped = !flipped;
  board.flip();
  updateMoves();
}

function updateMoveHistory() {
  // Store current position in history
  moveHistory = [];
  const tempGame = new Chess(startingFEN);
  moveHistory.push(tempGame.fen());

  // Replay all moves to build history
  const moves = game.history();
  for (let move of moves) {
    tempGame.move(move);
    moveHistory.push(tempGame.fen());
  }
}

function updateMoves() {
  if (ignoreMoveUpdate) return;

  const moves = game.history({ verbose: true });
  let movesText = "";

  // Determine starting move number and whose turn it is from FEN
  const fenParts = startingFEN.split(" ");
  let moveNumber = parseInt(fenParts[5]) || 1;
  let isWhiteTurn = fenParts[1] === "w";

  for (let i = 0; i < moves.length; i++) {
    if (isWhiteTurn) {
      // White move: "1.e4" or "2.Nf3"
      movesText += `${moveNumber}.${moves[i].san} `;
      isWhiteTurn = false;
    } else {
      // Black move
      if (i === 0 && fenParts[1] === "b") {
        // First move is black: "0...e5"
        movesText += `0...${moves[i].san} `;
      } else {
        // Subsequent black moves: "Nf6" (no dots)
        movesText += `${moves[i].san} `;
      }
      moveNumber++;
      isWhiteTurn = true;
    }
  }

  document.getElementById("movesText").value = movesText.trim();

  const tag = `[moves ${flipped ? "flip=true" : ""} start=${startingFEN}]`;
  document.getElementById(
    "output"
  ).value = `${tag}${movesText.trim()} [/moves]`;

  // Update navigation buttons state
  updateNavigationButtons();
}

function copyComment() {
  const out = document.getElementById("output");
  out.select();
  document.execCommand("copy");
}

function onDragStart(source, piece, position, orientation) {
  // Allow all drags - we'll validate in onDrop
  return true;
}

function onDrop(obj) {
  // Handle both parameter formats
  let source, target;

  if (typeof obj === "object" && obj.source && obj.target) {
    // Object format: {source: 'e2', target: 'e4'}
    source = obj.source;
    target = obj.target;
  } else {
    // Separate parameter format (deprecated)
    source = arguments[0];
    target = arguments[1];
  }

  console.log("Drop from", source, "to", target);

  const move = game.move({
    from: source,
    to: target,
    promotion: "q",
  });

  if (move === null) {
    console.log("Invalid move");
    return "snapback";
  }

  board.position(game.fen());
  updateMoveHistory();
  updateMoves();
  return move;
}

function onSnapEnd() {
  board.position(game.fen());
}

// Navigation functions
function goToStart() {
  if (moveHistory.length > 0) {
    game.load(moveHistory[0]);
    board.position(moveHistory[0]);
    updateMoves();
  }
}

function goToEnd() {
  if (moveHistory.length > 0) {
    game.load(moveHistory[moveHistory.length - 1]);
    board.position(moveHistory[moveHistory.length - 1]);
    updateMoves();
  }
}

function goBack() {
  const currentFEN = game.fen();
  const currentIndex = moveHistory.findIndex((fen) => fen === currentFEN);
  if (currentIndex > 0) {
    game.load(moveHistory[currentIndex - 1]);
    board.position(moveHistory[currentIndex - 1]);
    updateMoves();
  }
}

function goForward() {
  const currentFEN = game.fen();
  const currentIndex = moveHistory.findIndex((fen) => fen === currentFEN);
  if (currentIndex < moveHistory.length - 1) {
    game.load(moveHistory[currentIndex + 1]);
    board.position(moveHistory[currentIndex + 1]);
    updateMoves();
  }
}

function updateNavigationButtons() {
  const currentFEN = game.fen();
  const currentIndex = moveHistory.findIndex((fen) => fen === currentFEN);

  document.getElementById("btnStart").disabled = currentIndex <= 0;
  document.getElementById("btnBack").disabled = currentIndex <= 0;
  document.getElementById("btnForward").disabled =
    currentIndex >= moveHistory.length - 1;
  document.getElementById("btnEnd").disabled =
    currentIndex >= moveHistory.length - 1;
}

document.addEventListener("DOMContentLoaded", () => {
  board = Chessboard2("board", {
    pieceTheme: "img/chesspieces/alpha/{piece}.svg",
    position: "start",
    draggable: true,
    dropOffBoard: "snapback",
    sparePieces: false,
    orientation: "white",
    touchScreen: true, // Important for mobile devices

    // Event handlers
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
  });

  // Initialize with standard starting position
  startingFEN = game.fen();
  updateMoveHistory();
  updateMoves();

  // Add event listeners for navigation buttons
  document.getElementById("btnStart").addEventListener("click", goToStart);
  document.getElementById("btnBack").addEventListener("click", goBack);
  document.getElementById("btnForward").addEventListener("click", goForward);
  document.getElementById("btnEnd").addEventListener("click", goToEnd);
});
