let game = new Chess();
let board = null;
let flipped = false;
let startingFEN = "";
let ignoreMoveUpdate = false;

function loadFEN() {
  startingFEN = document.getElementById("fenInput").value.trim();
  if (!game.load(startingFEN)) {
    alert("Invalid FEN");
    return;
  }
  board.position(game.fen());
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
  let movesText = moves.map((move) => move.san).join(" ");
  document.getElementById("movesText").value = movesText.trim();

  const tag = `[moves ${flipped ? "flip=true" : ""} start=${startingFEN}]`;
  document.getElementById("output").value = `${tag}${movesText} [/moves]`;
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
  updateMoves();
  return move;
}

function onSnapEnd() {
  board.position(game.fen());
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
  updateMoves();
});
