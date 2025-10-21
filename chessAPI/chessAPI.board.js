chessAPI.board = {}

chessAPI.board.init = function() {

    this.squares = Array.from({ length: chessAPI.board.ranks }, function() {
        return Array.from({ length: chessAPI.board.files }, function() {
            return {};
        });
    });

    this.squares_1d = [];

    let square_color = "white";

    for (let y = 0; y < this.ranks; y++) {
        for (let x = 0; x < this.files; x++) {
            let square = this.squares[y][x];
            square.x = x;
            square.y = y;

            if (chessAPI.game.POV == "white") {
                square.rank = this.ranks - y;
                square.file = chessAPI.tools.alphabet[x];
            } else {
                square.rank = y + 1;
                square.file = chessAPI.tools.alphabet[this.files - 1 - x];
            }

            square.id = square.file + square.rank;
            square.color = square_color;
            square.occupied_by = false;
            square.html = chessAPI.draw_square(square);

            if (square.html) {
                square.html.addEventListener("click", function(e) {
                    chessAPI.board.square_click_handler(e, square);
                });
            }

            this.squares_1d.push(square);

            square_color = (square_color == "white") ? "black" : "white";
        }

        if (this.files % 2 == 0) {
            square_color = (square_color == "white") ? "black" : "white";
        }
    }
}

chessAPI.board.get_square = function() {
    let x, y, square = false;
    let coords = chessAPI.tools.algebraic_to_xy(...arguments);
    if (coords) {
        x = coords[0];
        y = coords[1];
    } else if (arguments.length >= 2) {
        x = arguments[0];
        y = arguments[1];
    }

    if (this.squares[y] && this.squares[y][x]) {
        square = this.squares[y][x];
    }

    return square;
}

chessAPI.board.path_between = function(s1, s2) {

    let path = [];

    let vector = { x: s1.x - s2.x, y: s1.y - s2.y }

    if (Math.abs(vector.x) == Math.abs(vector.y) || vector.x == 0 || vector.y == 0) {

        let start_x = Math.min(s1.x, s2.x), end_x = Math.max(s1.x, s2.x);
        let start_y = Math.min(s1.y, s2.y), end_y = Math.max(s1.y, s2.y);

        for (let y = start_y; y <= end_y; y++) {
            for (let x = start_x; x <= end_x; x++) {
                if (((y >= start_y + 1 && y < end_y) || start_y == end_y) && ((x >= start_x + 1 && x < end_x) || start_x == end_x)) {
                    path.push(chessAPI.board.get_square(x, y));
                }
            }
        }

    }
    return path;
}

chessAPI.board.path_is_clear = function(s1, s2, castling = false) {

    let path = this.path_between(s1, s2);

    for (let s of path) {
        if (s.occupied_by) { return false; }
    }

    if (castling) {

        let opponent_color = (s1.occupied_by.color == "white") ? "black" : "white";

        if (s1.occupied_by.type == "k") {
            path = path.reverse();
        }
        for (let i = 0; i <= 1; i++) {
            for (let op of chessAPI.pieces.get({ color: opponent_color })) {
                if (op.allowed_moves.includes(path[i])) {
                    return false;
                }
            }
        }
    }

    return true;
}

chessAPI.board.square_click_handler = function(e, square) {

    if (!chessAPI.game.active) { return false; }

    if (chessAPI.pieces.selected && chessAPI.pieces.selected.allowed_moves.includes(square)) {
        chessAPI.click_on_playable_square(square.html, square, chessAPI.pieces.selected.html, chessAPI.pieces.selected);
        e.stopPropagation();
        return false;
    }

    chessAPI.click_on_square(square.html, square);
}

chessAPI.board.trigger_playable_squares_hooks = function(piece, mode = true) {
    if (!piece) { return false }
    for (let s of piece.allowed_moves) {
        if (mode) {
            chessAPI.on_square_playable(s.html, s.occupied_by?.html || document.createElement("div"));
        } else {
            chessAPI.on_square_playable_revert(s.html, s.occupied_by?.html || document.createElement("div"));
        }
    }
}

chessAPI.board.clear_HTML = function() {
    if (!this.squares_1d) { return false; }
    for (let s of this.squares_1d) {
        if (s.html) {
            s.html.remove();
        };
    }
}