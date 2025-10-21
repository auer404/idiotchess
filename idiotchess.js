const IDIOTCHESS = {

    is_player:[],

    base_reflection_delay: 1000,
    reflection_delay_amplitude: 1000,
    selection_fx_delay: 250,

    timeout:false,

    pick_piece: function() {

        let playable_pieces = chessAPI.pieces.get({color:chessAPI.game.current_player});
        let movable_pieces = [];

        for (let p of playable_pieces) {
            if (p.allowed_moves.length > 0) {
                movable_pieces.push(p);
            }
        }

        let piece_index = Math.floor(Math.random() * movable_pieces.length);
        return movable_pieces[piece_index];
    },

    pick_move: function(p) {
        if (!p) {return false;}
        let move_index = Math.floor(Math.random() * p.allowed_moves.length);
        return p.allowed_moves[move_index];
    },

    play_move: function(p,m) {
        if (p && m) {
            chessAPI.game.play(p,m);
        }
    },

    play_turn: function() {

        this.while_reflecting();
        this.timeout = setTimeout(function() {

            this.reflection_done();
            let piece = this.pick_piece();
            if (piece) {
                let move = this.pick_move(piece);
                piece.select();
                this.timeout = setTimeout(function(){
                    this.play_move(piece, move);
                }.bind(this),this.selection_fx_delay);
            }
            
        }.bind(this),this.reflection_delay());
    },

    play_turn_if_allowed: function() {
        if (this.is_player.includes(chessAPI.game.current_player)) {
            this.play_turn();
        }
    },

    promote: function(p) {

        this.while_reflecting();

        this.timeout = setTimeout(function(){
            this.reflection_done();
            let options = ["q","b","r","n"];
            let option_index = Math.floor(Math.random() * options.length);
            let picked_option = options[option_index];

            let btn = document.querySelector(".promo_options." + p.color + " .option[data-type='" + picked_option + "']" );
            
            btn.classList.add("hover");

            this.timeout = setTimeout(function(){
                p.promote(picked_option);
                btn.classList.remove("hover");
            },this.selection_fx_delay);

        }.bind(this),this.reflection_delay());
    },

    promote_if_allowed: function(p) {
        if (this.is_player.includes(chessAPI.game.current_player)) {
            this.promote(p);
        }
    },

    reflection_delay: function() {
        return this.base_reflection_delay + Math.round(Math.random() * this.reflection_delay_amplitude);
    },

    while_reflecting: function() {
        // HOOK
    },

    reflection_done: function() {
        // HOOK
    },

    has_control: function() {
        return this.is_player.includes(chessAPI.game.current_player) && chessAPI.game.active;
    }
}