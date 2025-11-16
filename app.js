let game = new Chess();
let board = null;
let flipped = false;
let startingFEN = "";
let ignoreMoveUpdate = false;
let moveHistory = [];
let currentMoveIndex = 0;

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
  resetMoveHistory();
  generateMoves();
}

function flipBoard() {
  flipped = !flipped;
  board.flip();
  updateOutput();
}

function resetMoveHistory() {
  moveHistory = [];
  const tempGame = new Chess(startingFEN);
  moveHistory.push({
    fen: tempGame.fen(),
    move: null,
  });

  // Replay all moves to build history
  const moves = game.history();
  for (let move of moves) {
    tempGame.move(move);
    moveHistory.push({
      fen: tempGame.fen(),
      move: move,
    });
  }
  currentMoveIndex = moveHistory.length - 1;
}

function generateMoves() {
  // Only generate moves up to current position
  let movesText = "";
  const fenParts = startingFEN.split(" ");
  let moveNumber = parseInt(fenParts[5]) || 1;
  let isWhiteTurn = fenParts[1] === "w";

  for (let i = 1; i <= currentMoveIndex; i++) {
    const moveObj = moveHistory[i];
    if (isWhiteTurn) {
      // White move
      movesText += `${moveNumber}.${moveObj.move} `;
      isWhiteTurn = false;
    } else {
      // Black move
      if (i === 1 && fenParts[1] === "b") {
        // First move is black: use 0...
        movesText += `0...${moveObj.move} `;
        // Don't increment move number yet - wait for the next white move
      } else {
        // Regular black move
        movesText += `${moveObj.move} `;
        // After a black move (except the very first one), increment move number
        moveNumber++;
      }
      isWhiteTurn = true;
    }
  }

  document.getElementById("movesText").value = movesText.trim();
  updateOutput();
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

function onDragStart(source, piece, position, orientation) {
  return true;
}

function onDrop(obj) {
  let source, target;

  if (typeof obj === "object" && obj.source && obj.target) {
    source = obj.source;
    target = obj.target;
  } else {
    source = arguments[0];
    target = arguments[1];
  }

  console.log("Drop from", source, "to", target);

  // If we're not at the end of the move history, create a new branch
  if (currentMoveIndex < moveHistory.length - 1) {
    // Load the position we're currently viewing
    game.load(moveHistory[currentMoveIndex].fen);
  }

  const move = game.move({
    from: source,
    to: target,
    promotion: "q",
  });

  if (move === null) {
    console.log("Invalid move");
    return "snapback";
  }

  // If we made a move from a historical position, truncate the history
  if (currentMoveIndex < moveHistory.length - 1) {
    moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
  }

  // Add the new move to history
  moveHistory.push({
    fen: game.fen(),
    move: move.san,
  });
  currentMoveIndex = moveHistory.length - 1;

  board.position(game.fen());
  generateMoves();
  return move;
}

function onSnapEnd() {
  board.position(game.fen());
}

// Navigation functions
function goToStart() {
  if (moveHistory.length > 0) {
    currentMoveIndex = 0;
    game.load(moveHistory[currentMoveIndex].fen);
    board.position(moveHistory[currentMoveIndex].fen);
    updateNavigationButtons();
    updateOutput();
  }
}

function goToEnd() {
  if (moveHistory.length > 0) {
    currentMoveIndex = moveHistory.length - 1;
    game.load(moveHistory[currentMoveIndex].fen);
    board.position(moveHistory[currentMoveIndex].fen);
    updateNavigationButtons();
    updateOutput();
  }
}

function goBack() {
  if (currentMoveIndex > 0) {
    currentMoveIndex--;
    game.load(moveHistory[currentMoveIndex].fen);
    board.position(moveHistory[currentMoveIndex].fen);
    updateNavigationButtons();
    updateOutput();
  }
}

function goForward() {
  if (currentMoveIndex < moveHistory.length - 1) {
    currentMoveIndex++;
    game.load(moveHistory[currentMoveIndex].fen);
    board.position(moveHistory[currentMoveIndex].fen);
    updateNavigationButtons();
    updateOutput();
  }
}

function updateNavigationButtons() {
  document.getElementById("btnStart").disabled = currentMoveIndex <= 0;
  document.getElementById("btnBack").disabled = currentMoveIndex <= 0;
  document.getElementById("btnForward").disabled =
    currentMoveIndex >= moveHistory.length - 1;
  document.getElementById("btnEnd").disabled =
    currentMoveIndex >= moveHistory.length - 1;
}

function setupMovesTextListener() {
  const movesTextarea = document.getElementById("movesText");
  movesTextarea.addEventListener("input", function () {
    updateOutput();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  board = Chessboard2("board", {
    pieceTheme: "img/chesspieces/alpha/{piece}.svg",
    position: "start",
    draggable: true,
    dropOffBoard: "snapback",
    sparePieces: false,
    orientation: "white",
    touchScreen: true,

    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
  });

  // Initialize with standard starting position
  startingFEN = game.fen();
  resetMoveHistory();
  generateMoves();

  // Add event listeners for navigation buttons
  document.getElementById("btnStart").addEventListener("click", goToStart);
  document.getElementById("btnBack").addEventListener("click", goBack);
  document.getElementById("btnForward").addEventListener("click", goForward);
  document.getElementById("btnEnd").addEventListener("click", goToEnd);

  setupMovesTextListener();
});
