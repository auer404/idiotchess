chessAPI.tools = {}

chessAPI.tools.algebraic_to_xy = function() {

    let rank, file, x, y;

    if (arguments.length == 0 || typeof arguments[0] != "string") {
        return false;
    } else if (arguments[0].length == 2) {
        file = arguments[0][0];
        rank = arguments[0][1] * 1;
    } else if (arguments.length > 1 && arguments[0].length == 1) {
        file = arguments[0];
        rank = arguments[1];
    }

    if (this.alphabet.includes(file) && rank > 0 && rank <= chessAPI.board.ranks) {

        if (chessAPI.game.POV == "white") {
            x = this.alphabet.indexOf(file);
            y = chessAPI.board.ranks - rank;
        } else {
            x = chessAPI.board.ranks - 1 - this.alphabet.indexOf(file);
            y = rank - 1;
        }
        return [x, y];
    }

    return false;
}

chessAPI.tools.parse_FEN = function(FEN) {

    let pieces_error = false;

    let FEN_splitted = FEN.split(" ");

    let board_exp = FEN_splitted[0];
    let ranks = board_exp.split("/");

    let pieces = [];

    for (let y = 0; y < ranks.length; y++) {
        let x = 0;
        for (let char of ranks[y]) {

            if (x >= chessAPI.board.files) {
                pieces_error = true;
            }

            if (isNaN(char)) {

                let final_x = x;
                let final_y = y;

                if (chessAPI.game.POV == "black") {
                    final_x = chessAPI.board.files - final_x - 1;
                    final_y = chessAPI.board.ranks - final_y - 1;
                }

                let color = "white";
                if (char != char.toUpperCase()) {
                    color = "black";
                } else {
                    char = char.toLowerCase();
                }

                pieces.push({ x: final_x, y: final_y, type: char, color: color });

                x++;

            } else {
                x += parseInt(char);
            }
        }
    }

    let current_player_exp = FEN_splitted[1];
    let current_player = "white";
    if (current_player_exp == "b") {
        current_player = "black";
    }

    let castling_exp = FEN_splitted[2];

    let castling_state = {
        white_k: castling_exp.includes("K") || castling_exp.includes("Q"),
        white_r_by_distance_asc: [castling_exp.includes("K"), castling_exp.includes("Q")],
        black_k: castling_exp.includes("k") || castling_exp.includes("q"),
        black_r_by_distance_asc: [castling_exp.includes("k"), castling_exp.includes("q")]
    };

    let enpassant_exp = FEN_splitted[3];

    let enpassant_state = (enpassant_exp != "-") ? enpassant_exp : false;

    let uneventful_turns = parseInt(FEN_splitted[4]);
    let move = parseInt(FEN_splitted[5]);

    if (pieces_error) {
        pieces = [];
    }

    return {
        positions: pieces,
        current_player: current_player,
        castling_state: castling_state,
        enpassant_state: enpassant_state,
        uneventful_turns: uneventful_turns,
        move: move
    };
}

chessAPI.all_components_available();