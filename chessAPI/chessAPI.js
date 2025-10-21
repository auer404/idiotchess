/**********************
*** chessAPI v.0.9 ****
***** by auer404 *****/

const chessAPI = {

    options_file_path: "chessAPI/chessAPI.options.json",

    init: async function() {

        let components_available = new Promise(function(resolve) {
            chessAPI.all_components_available = resolve;
        });

        let running = new Promise(function(resolve) {
            chessAPI.run = resolve;
        });

        await components_available;

        fetch(chessAPI.options_file_path).then(function(res) {
            res.json().then(async function(file_contents) {
                this.options = file_contents;

                this.game.default_FEN = this.options.preset_FEN[this.options.default_FEN];
                this.tools.alphabet = this.options.alphabet;
                this.board.files = this.options.board_files;
                if (this.board.files > this.options.alphabet.length) {
                    this.board.files = this.options.alphabet.length;
                }
                this.board.ranks = this.options.board_ranks;
                this.pieces.moveset_rules = this.options.moveset_rules;
                this.game.POV = this.options.pov;
                this.game.auto_draw_after = this.options.auto_draw_after;

                await running;

                this.when_ready();

            }.bind(chessAPI));

        });

    },

    // HOOKS :

    when_ready: function() {}, // should be filled before chessAPI.run() call

    draw_square: function(square) {}, // should return a DOM element
    draw_piece: function(piece, square) {}, // should return a DOM element

    click_on_square: function(HTML_square, square) {},
    click_on_piece: function(HTML_piece, piece) {},

    click_on_playable_square: function(HTML_square, square, HTML_selected_piece, selected_piece) {},
    click_on_playable_piece: function(HTML_piece, piece) {},

    on_piece_select: function(HTML_piece, piece) {},
    on_piece_deselect: function(HTML_piece, piece) {},

    on_new_turn: function(player_color) {},

    on_piece_move: function(HTML_piece, piece, HTML_dest_square, dest_square, HTML_prev_square, prev_square, HTML_enpassant_square, enpassant_square, is_castling_rook) {},
    on_piece_taken: function(HTML_taken_piece, HTML_square, HTML_taking_piece, HTML_square_enpassant, square_enpassant) {},

    on_square_playable: function(HTML_square, HTML_occupying_piece) {},
    on_square_playable_revert: function(HTML_square, HTML_occupying_piece) {},

    on_await_promotion: function(HTML_piece, piece, HTML_square, square) {},
    on_promoted: function(HTML_piece, piece, new_type, HTML_square, square) {},

    on_check: function(HTML_piece, piece, HTML_attacker_piece, attacker_piece) {},
    on_checkmate: function(HTML_piece, piece, HTML_attacker_piece, attacker_piece) {},
    on_stalemate: function(HTML_piece, piece) {},
    on_draw: function() {}

};

chessAPI.init();
