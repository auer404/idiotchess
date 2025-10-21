chessAPI.pieces = {}

chessAPI.pieces.init = function(map, castling_status, enpassant_status) {

    this.list = [];
    this.selected = false;

    for (let pos of map) {
        this.add(pos.type, pos.color, chessAPI.board.get_square(pos.x, pos.y));
    }

    this.check_ini_castling_status(castling_status);
    this.check_ini_enpassant_status(enpassant_status);
}

chessAPI.pieces.add = function(type, color, square) {

    let piece = { type: type, color: color, occupies: square }

    square.occupied_by = piece;

    piece.html = chessAPI.draw_piece(piece, square);

    if (piece.html) {
        piece.html.addEventListener("click", function(e) {
            chessAPI.pieces.piece_click_handler(e, piece);
        });
    }

    if (piece.type == "p" && chessAPI.game.POV != piece.color) {
        piece.moveset_rules = JSON.parse(JSON.stringify(chessAPI.pieces.moveset_rules["p_opposite"]));
    } else {
        piece.moveset_rules = JSON.parse(JSON.stringify(chessAPI.pieces.moveset_rules[piece.type]));
    }

    piece.initial_state = true;
    piece.in_game = true;
    piece.allowed_moves = [];
    piece.potential_allowed_moves = [];
    piece.base_moves = [];

    piece.get_allowed_moves = function(options) { return chessAPI.pieces.get_allowed_moves_for(piece, options); }

    piece.lines_of_sight = function() { return chessAPI.pieces.get_lines_of_sight(piece); }

    piece.promote = function(type) {

        this.type = type;
        this.moveset_rules = chessAPI.pieces.moveset_rules[type];

        this.promoted();
    }

    piece.select = function() { chessAPI.pieces.select_piece(piece, true); }
    piece.deselect = function() { chessAPI.pieces.select_piece(piece, false); }
    piece.toggle_select = function() { chessAPI.pieces.select_piece(piece, chessAPI.pieces.selected != piece); }

    chessAPI.pieces.list.push(piece);
}

chessAPI.pieces.check_ini_castling_status = function(castling_state) {

    for (let k of this.get({ type: "k" })) {

        if (castling_state[k.color + "_k"]) {
            let r_array = [];
            for (let r of this.get({ type: "r", color: k.color })) {
                let dist = Math.abs(k.occupies.x - r.occupies.x);
                r_array[dist] = r;
            }
            r_array.sort();
            r_array = r_array.filter(function(e) { return e; })

            for (let sorted_r of r_array) {
                if (!castling_state[k.color + "_r_by_distance_asc"][r_array.indexOf(sorted_r)]) {
                    sorted_r.initial_state = false;
                }
            }
        } else {
            k.initial_state = false;
        }
    }
}

chessAPI.pieces.check_ini_enpassant_status = function(enpassant_state) {

    if (enpassant_state) {
        let ep_dest = chessAPI.board.get_square(enpassant_state);
        let top_half = ep_dest.rank > chessAPI.board.ranks / 2;
        let ep_target_square;
        if ((top_half && chessAPI.game.POV == "white") || (!top_half && chessAPI.game.POV == "black")) {
            ep_target_square = chessAPI.board.get_square(ep_dest.x, ep_dest.y + 1);
        } else {
            ep_target_square = chessAPI.board.get_square(ep_dest.x, ep_dest.y - 1);
        }
        let ep_target = ep_target_square.occupied_by;
        if (ep_target && ep_target.type == "p" && ep_target.color != chessAPI.game.current_player) {
            ep_target.initial_state = false;
            ep_target.double_step = true;
            ep_target.ep_occupies = ep_dest;
            ep_dest.ep_occupied_by = ep_target;
        }
    }
}

chessAPI.pieces.get = function(obj) {
    let found = [];
    for (let p of this.list) {
        if (p.in_game && ((p.color == obj.color && p.type == obj.type) || (p.color == obj.color && !obj.type) || (!obj.color && p.type == obj.type))) {
            found.push(p);
        }
    }
    return found;
}

chessAPI.pieces.get_allowed_moves_for = function(p, options) {

    let allowed_moves = [], potential_allowed_moves = [], base_moves = [];

    if (p.in_game) {

        let x = p.occupies.x, y = p.occupies.y;

        for (let m of p.moveset_rules) {

            let target_coords = [x, y];
            let done = false;
            let repeat = m.repeat || false;
            let block = false;

            while (repeat || !done) {

                target_coords[0] += m.x;
                target_coords[1] += m.y;

                let target = chessAPI.board.get_square(...target_coords);

                if (target) {
                    base_moves.push(target);

                    let occupied = target.occupied_by;
                    if (occupied && options?.ignore && options.ignore == target) {
                        occupied = false;
                    }

                    if (!block && ((!occupied && m.condition != "occupied") || (occupied && occupied.color != p.color && m.condition != "free"))) {
                        allowed_moves.push(target);
                    }

                    if (m.condition == "occupied") {
                        potential_allowed_moves.push(target);
                    }

                    if (occupied) {
                        if (occupied.color == p.color) {
                            potential_allowed_moves.push(target);
                        }
                        block = true;
                    }

                    if (!isNaN(repeat) && repeat > 0 && repeat !== true) {
                        repeat--;
                    }
                    if (!repeat) {
                        done = true;
                        repeat = false;
                    }

                } else {
                    done = true;
                    repeat = false;
                }
            }
        }

    }

    return {
        allowed_moves: allowed_moves,
        potential_allowed_moves: potential_allowed_moves,
        base_moves: base_moves
    }
}

chessAPI.pieces.update_pawns_doublestep_status = function() {

    for (let p of this.get({ type: "p" })) {
        if (!p.initial_state) {
            for (let m of p.moveset_rules) {
                if (m.repeat) {
                    delete (p.moveset_rules[p.moveset_rules.indexOf(m)].repeat);
                }
            }
        }
    }

}

chessAPI.pieces.update_enpassant_status = function() {

    let pawns = this.get({ type: "p" })

    for (let p of pawns) {

        if (p.ep_sensitive) {
            delete (p.ep_sensitive);
            delete (p.ep_occupies.ep_occupied_by);
            delete (p.ep_occupies);
        }

        if (p.double_step) {
            delete (p.double_step);
            p.ep_sensitive = true;
        }

    }

    for (let p of pawns) {

        let x_to_check = [p.occupies.x - 1, p.occupies.x + 1];
        for (let x of x_to_check) {
            let s = chessAPI.board.get_square(x, p.occupies.y);
            if (s.occupied_by && s.occupied_by.type == "p" && s.occupied_by.ep_sensitive) {
                p.allowed_moves.push(s.occupied_by.ep_occupies);
            }
        }

    }

}

chessAPI.pieces.apply_kings_base_restrictions = function() {

    let k_check = false;

    for (let k of this.get({ type: "k" })) {

        delete (k.check_by);

        let opponent_color = (k.color == "white") ? "black" : "white";

        for (let op of this.get({ color: opponent_color })) {

            if (op.allowed_moves.includes(k.occupies)) {
                k.check_by = op;
                k_check = k;
            }

            let k_restricted_moves = [];

            for (let km of k.allowed_moves) {
                if (!op.potential_allowed_moves.includes(km) && (!op.allowed_moves.includes(km) || op.type == "p") && !k_restricted_moves.includes(km)) {

                    let extended_op_moves = op.get_allowed_moves({ ignore: k.occupies }).allowed_moves;
                    if (!extended_op_moves.includes(km)) {
                        k_restricted_moves.push(km);
                    }

                }
            }
            
            k.allowed_moves = k_restricted_moves;
        }

        this.apply_king_castling_rights(k);
    }
    return k_check;
}

chessAPI.pieces.apply_king_castling_rights = function(k) {

    if (k.initial_state && !k.check_by) {
            for (let r of this.get({ type: "r", color: k.color })) {
                if (r.initial_state && chessAPI.board.path_is_clear(k.occupies, r.occupies, true)) {
                    k.allowed_moves.push(r.occupies);
                }
            }
        }
}

chessAPI.pieces.apply_pin_restrictions = function() {

    for (let p of this.list) {

        if (p.type != "k") {

            let k = this.get({ type: "k", color: p.color })[0];
            let k_sight = k?.lines_of_sight();

            if (k) {
                for (let path of k_sight) {
                    if (path.includes(p.occupies)) {
                        let pieces_on_path = [];
                        for (let s of path) {
                            if (s.occupied_by) {
                                if (s.occupied_by.color == k.color || !s.occupied_by.base_moves.includes(k.occupies)) {
                                    if (s.occupied_by == p) {
                                        pieces_on_path.push("self");
                                    } else {
                                        pieces_on_path.push("shield");
                                    }
                                } else {
                                    pieces_on_path.push("threat");
                                }
                            }
                        }

                        if (pieces_on_path[0] == "self" && pieces_on_path[1] == "threat") {

                            let pinned_moves = [];
                            for (let m of p.allowed_moves) {
                                if (path.includes(m)) {
                                    pinned_moves.push(m);
                                }
                            }
                            p.allowed_moves = pinned_moves;
                        }
                    }
                }
            }

        }
    }

}

chessAPI.pieces.apply_king_rescue_restrictions = function(k_check) {

    if (k_check) {
        for (let p of this.get({ color: k_check.color })) {

            let restricted_moves = [];

            for (let move of p.allowed_moves) {
                if (p == k_check) {
                    if (!k_check.check_by.allowed_moves.includes(move)) {
                        restricted_moves.push(move);
                    }
                } else {
                    if ((k_check.check_by.allowed_moves.includes(move) && chessAPI.board.path_between(k_check.occupies, k_check.check_by.occupies).includes(move)) || move == k_check.check_by.occupies) {
                        restricted_moves.push(move);
                    }
                }
            }
            p.allowed_moves = restricted_moves;
        }
    }
}

chessAPI.pieces.update_allowed_moves = function() {

    this.update_pawns_doublestep_status();

    for (let p of this.list) {

        let lists = p.get_allowed_moves();
        p.allowed_moves = lists.allowed_moves;
        p.potential_allowed_moves = lists.potential_allowed_moves;
        p.base_moves = lists.base_moves;

    }

    this.update_enpassant_status();
    this.apply_king_rescue_restrictions(this.apply_kings_base_restrictions());
    this.apply_pin_restrictions();   
}

chessAPI.pieces.get_lines_of_sight = function(piece) {

    let p_x = piece.occupies.x, p_y = piece.occupies.y;
    let x_min = 0, x_max = chessAPI.board.files - 1;
    let y_min = 0, y_max = chessAPI.board.ranks - 1;

    let lines = Array.from({ length: 8 }, function() { return [] });

    var step = 0;
    for (let y = p_y - 1; y >= 0; y--) {
        step++;
        lines[0].push(chessAPI.board.get_square(p_x, y));
        let diag_s = chessAPI.board.get_square(p_x + step, y);
        if (diag_s) {
            lines[1].push(diag_s);
        }
    }

    step = 0;
    for (let x = p_x + 1; x <= x_max; x++) {
        step++;
        lines[2].push(chessAPI.board.get_square(x, p_y));
        let diag_s = chessAPI.board.get_square(x, p_y + step);
        if (diag_s) {
            lines[3].push(diag_s);
        }
    }

    step = 0;
    for (let y = p_y + 1; y <= y_max; y++) {
        step++;
        lines[4].push(chessAPI.board.get_square(p_x, y));
        let diag_s = chessAPI.board.get_square(p_x - step, y);
        if (diag_s) {
            lines[5].push(diag_s);
        };
    }

    step = 0;
    for (let x = p_x - 1; x >= 0; x--) {
        step++;
        lines[6].push(chessAPI.board.get_square(x, p_y));
        let diag_s = chessAPI.board.get_square(x, p_y - step);
        if (diag_s) {
            lines[7].push(diag_s);
        };
    }

    return lines;
}

chessAPI.pieces.piece_click_handler = function(e, piece) {

    if (!chessAPI.game.active) { return false; }

    if (piece.color == chessAPI.game.current_player && piece.allowed_moves.length > 0) {

        if (piece.type == "r" && chessAPI.pieces.selected.type == "k" && chessAPI.pieces.selected.color == piece.color && chessAPI.pieces.selected.allowed_moves.includes(piece.occupies)) {
            chessAPI.click_on_playable_square(piece.occupies.html, piece.occupies, chessAPI.pieces.selected.html, chessAPI.pieces.selected);
        } else {
            chessAPI.click_on_playable_piece(piece.html, piece);
        }
        e.stopPropagation();
        return false;
    }

    if (piece.color !== chessAPI.game.current_player && chessAPI.pieces.selected && chessAPI.pieces.selected.allowed_moves.includes(piece.occupies)) {
        chessAPI.click_on_playable_square(piece.occupies.html, piece.occupies, chessAPI.pieces.selected.html, chessAPI.pieces.selected);
        e.stopPropagation();
        return false;
    }

    chessAPI.click_on_piece(piece.html, piece);
}

chessAPI.pieces.clear_HTML = function() {
    if (!this.list) { return false; }
    for (let p of this.list) {
        if (p.html) {
            p.html.remove();
        };
    }
}

/*** INTERACTIONS ***/

chessAPI.pieces.select_piece = function(piece, mode) {

    if (!chessAPI.game.active) { return false; }

    if (chessAPI.pieces.selected == piece && !mode) {

        chessAPI.board.trigger_playable_squares_hooks(piece, false);
        chessAPI.pieces.selected = false;
        chessAPI.on_piece_deselect(piece.html, piece);

    } else if (chessAPI.pieces.selected != piece && mode) {

        if (chessAPI.pieces.selected) {
            chessAPI.board.trigger_playable_squares_hooks(chessAPI.pieces.selected, false);
            chessAPI.on_piece_deselect(chessAPI.pieces.selected.html, chessAPI.pieces.selected);
        }

        chessAPI.pieces.selected = piece;
        chessAPI.on_piece_select(piece.html, piece);
        chessAPI.board.trigger_playable_squares_hooks(piece);
    }
}

chessAPI.pieces.deselect_all = function() {
    if (this.selected) {
        this.select_piece(this.selected, false);
    }
}