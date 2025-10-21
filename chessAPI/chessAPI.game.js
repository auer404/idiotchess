chessAPI.game = {}

chessAPI.game.start = function() {

    let ini_state = chessAPI.tools.parse_FEN(this.default_FEN);
    chessAPI.board.init();
    chessAPI.pieces.init(ini_state.positions, ini_state.castling_state, ini_state.enpassant_state);

    this.current_move = ini_state.move;
    this.uneventful_move_count = ini_state.uneventful_turns;

    this.initial_player = ini_state.current_player;
    this.current_player = this.initial_player;

    this.current_turn = ini_state.move * 2 - 1;

    if (this.current_player == "white") {
        this.current_turn--;
    }

    this.active = true;

    this.next_turn();
}

chessAPI.game.next_turn = function() {

    if (this.current_turn > 0) {
        this.current_player = (this.current_player == "white") ? "black" : "white";
        if (this.current_player == this.initial_player) {
            this.current_move++;
            this.uneventful_move_count++;
        }
    }

    this.current_turn++;

    chessAPI.pieces.update_allowed_moves();

    chessAPI.on_new_turn(this.current_player);

    let total_allowed_moves = { white: 0, black: 0 }

    for (let p of chessAPI.pieces.list) {
        if (p.in_game) {
            total_allowed_moves[p.color] += p.allowed_moves.length;
        }
    }

    let k_check = false;

    for (let k of chessAPI.pieces.get({ type: "k" })) {
        if (k.check_by) {
            k_check = k;
            chessAPI.on_check(k.html, k, k.check_by.html, k.check_by);
        }
    }

    for (let color in total_allowed_moves) {

        if (total_allowed_moves[color] == 0) {

            if (k_check && k_check.color == color) {
                this.active = false;
                chessAPI.on_checkmate(k_check.html, k_check, k_check.check_by.html, k_check.check_by);
                return false;
            } else {
                this.active = false;
                let k = chessAPI.pieces.get({ type: "k", color: color })[0];
                if (k) {
                    chessAPI.on_stalemate(k.html, k);
                }
                return false;
            }

        }
    }

    if (this.auto_draw_after && this.uneventful_move_count >= this.auto_draw_after) {
        this.active = false;
        chessAPI.on_draw();
    }

}

chessAPI.game.play = async function(piece, square) {

    if (!this.active) { return false; }

    let prev_square = piece.occupies;
    let taken_piece = square.occupied_by || square.ep_occupied_by;

    if (taken_piece && taken_piece.color == piece.color && taken_piece.type == "r" && piece.type == "k") {

        let override_x = prev_square.x + 2;
        let rook_x = override_x - 1;
        if (square.x < prev_square.x) {
            override_x = prev_square.x - 2;
            rook_x = override_x + 1;
        }
        square = chessAPI.board.get_square(override_x, square.y);
        rook_square = chessAPI.board.get_square(rook_x, square.y);

        let prev_rook_square = taken_piece.occupies;

        taken_piece.occupies = rook_square;

        chessAPI.on_piece_move(taken_piece.html, taken_piece, rook_square.html, rook_square, prev_rook_square.html, prev_rook_square, false, false, true);

        taken_piece.occupied_by = false;
        taken_piece = false;

    }

    piece.occupies.occupied_by = false;
    square.occupied_by = piece;
    piece.occupies = square;

    if (piece.type == "p" && Math.abs(prev_square.y - square.y) == 2) {
        piece.double_step = true;
        let first_step_y = square.y + (prev_square.y - square.y) / 2;
        piece.ep_occupies = chessAPI.board.get_square(piece.occupies.x, first_step_y);
        piece.ep_occupies.ep_occupied_by = piece;
    }

    let ep_square = false, ep_square_html = false;

    if (square.ep_occupied_by) {
        ep_square = square.ep_occupied_by.occupies;
        ep_square_html = ep_square.html;

        ep_square.occupied_by = false;
    }

    chessAPI.on_piece_move(piece.html, piece, square.html, square, prev_square.html, prev_square, ep_square_html, ep_square);

    if (taken_piece) {
        chessAPI.on_piece_taken(taken_piece.html, square.html, piece.html, ep_square_html, ep_square);
        taken_piece.in_game = false;
    }

    piece.initial_state = false;

    if (square.ep_occupied_by) {
        delete (square.ep_occupied_by);
    }

    piece.deselect();

    if (piece.type == "p" && (square.y == 0 || square.y == chessAPI.board.ranks - 1)) {

        let promoted = new Promise(function(resolve) {
            piece.promoted = resolve;
        });

        chessAPI.on_await_promotion(piece.html, piece, square.html, square);

        await promoted;

        chessAPI.on_promoted(piece.html, piece, piece.type, square.html, square);

    }

    if (piece.type == "p" || taken_piece) {
        this.uneventful_move_count = 0;
    }

    chessAPI.game.next_turn();
}

chessAPI.game.clear = function() {

    this.active = false;
    chessAPI.board.clear_HTML();
    chessAPI.pieces.clear_HTML();

}