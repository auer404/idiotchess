const square_size = 60;
const piece_size = 60;
const piece_move_duration = 500;

const board = document.querySelector(".board");
const game_status = document.querySelector("#game_status");
const overlay = document.querySelector("#overlay");
const menu = document.querySelector("#menu");
const PvsCPU_btn = document.querySelector("#PvsCPU_btn");
const CPUvsCPU_btn = document.querySelector("#CPUvsCPU_btn");
const message = document.querySelector("#message");
const message_confirm = message.querySelector("button");
const credits = document.querySelector("#credits");
const credits_confirm = credits.querySelector("button");
const show_credits_btn = document.querySelector("#credits_btn");


/*** GAME INI ***/

let intro_mode = true;
let promo_timeout, status_ud_timeout;
let piece_to_promote = false;
let forced_menu = false;

chessAPI.when_ready = function() {

    const injected_CSS = document.createElement("style");
    document.head.append(injected_CSS);
    injected_CSS.innerHTML = `:root {
        --square_size: ${square_size}px;
        --piece_size:${piece_size}px;
        --board_files:${chessAPI.board.files};
        --board_ranks:${chessAPI.board.ranks};
        --piece_move_duration:${piece_move_duration}ms;
    }`;

    document.body.classList.add("pov_" + chessAPI.game.POV);

    IDIOTCHESS.is_player = ["white", "black"];
    IDIOTCHESS.base_reflection_delay = 500;
    IDIOTCHESS.reflection_delay_amplitude = 0;

    chessAPI.game.start();

    write_intro();

    board.addEventListener("mousemove", board_initial_hover);
    board.classList.remove("refreshing");
    
}

chessAPI.run();


/*** BOARD & PIECES VISUAL ASPECT ***/

chessAPI.draw_square = function(s) {

    let elem = document.createElement("div");
    board.append(elem);
    elem.className = "square " + s.color;
    elem.style.left = 2 + s.x * square_size + "px";
    elem.style.top = 2 + s.y * square_size + "px";

    return elem;
}

chessAPI.draw_piece = function(p, s) {

    let elem = document.createElement("div");
    board.append(elem);

    let img_file = p.color + "_" + p.type;

    elem.className = "piece " + p.color + " on_" + s.color;
    elem.style.left = 2 + s.x * square_size + "px";
    elem.style.top = 2 + s.y * square_size + "px";

    elem.style.backgroundImage = "url(images/" + img_file + ".png)";

    return elem;
}


/*** CLICK HANDLERS ***/

chessAPI.click_on_playable_piece = function(elem, p) {
    if (IDIOTCHESS.is_player.includes(p.color)) { return false; }
    p.toggle_select();
}

chessAPI.click_on_playable_square = function(elem_s, s, elem_p, p) {
    if (IDIOTCHESS.is_player.includes(p.color)) { return false; }
    chessAPI.game.play(p, s);
}

document.body.addEventListener("click", function(){
    if (!IDIOTCHESS.has_control()) {
        chessAPI.pieces.deselect_all();
    }
});


/*** GAME EVENTS HANDLERS ***/

chessAPI.on_new_turn = function(player_color) {

    if (!intro_mode) {
        status_ud_timeout = setTimeout(function(){
            update_game_status();
        },500);
    }

    for (let p of document.querySelectorAll(".piece")) {
        p.classList.add("unselectable");

        if (p.classList.contains(player_color) && !IDIOTCHESS.is_player.includes(player_color)) {
            p.classList.remove("unselectable");
        }
    }

    IDIOTCHESS.play_turn_if_allowed();
}

chessAPI.on_piece_select = function(elem, p) {
    elem.classList.add("selected");
}

chessAPI.on_piece_deselect = function(elem, p) {
    elem.classList.remove("selected");
}

chessAPI.on_piece_move = function(elem_p, p, elem_s, s, elem_prev_s, prev_s, elem_ep_s, ep_s, is_castling_rook) {
   
    elem_p.classList.add("moving");

    let delay = 0;
    if (is_castling_rook) {
        delay = 400;
        elem_p.classList.add("castling_rook");
        setTimeout(function() {
            elem_p.classList.remove("castling_rook");
        }, 1400);
    } else if (ep_s) {
        delay = 400;
        elem_p.style.top = elem_ep_s.style.top;
        elem_p.style.left = elem_ep_s.style.left;
    }

    ghost_fx(elem_p, elem_prev_s);

    setTimeout(function() {

        elem_p.style.top = elem_s.style.top;
        elem_p.style.left = elem_s.style.left;
        if (is_castling_rook) {
            ghost_fx(elem_p, elem_prev_s);
        }
        elem_p.classList.remove("on_" + prev_s.color);
        elem_p.classList.add("on_" + s.color);

        setTimeout(function(){
            elem_p.classList.remove("moving");
        },piece_move_duration);

    }, delay);

    remove_intro_char(elem_s);
}

chessAPI.on_piece_taken = function(elem_p, elem_s, elem_taking_p, elem_s_enpassant, s_enpassant) {
    elem_p.remove();
    ghost_fx(elem_p, elem_s_enpassant || elem_s, true);
}

chessAPI.on_check = function(elem_k, k, elem_attacker, attacker) {
    check_fx(elem_k);   
}

chessAPI.on_checkmate = function(elem_k, k, elem_attacker, attacker) {
    
    setTimeout(function() {
        elem_k.classList.add("dead_king");
    }, 500);
    if (intro_mode) {return false}
    setTimeout(function() {
        show_message("<h2>Checkmate !</h2><p>" + attacker.color + " wins.</p>");
        board.addEventListener("mousemove", board_initial_hover);
        clearTimeout(status_ud_timeout);
        update_game_status(`<b class='${attacker.color}'>${attacker.color}</b> won on `);
    }, 1000);
}

chessAPI.on_stalemate = function(elem_k, k) {
    if (intro_mode) {return false}
    setTimeout(function() {
        show_message("<h2>Stalemate</h2><p>" + k.color + " can't move.</p>");
        board.addEventListener("mousemove", board_initial_hover);
        clearTimeout(status_ud_timeout);
        update_game_status(`<b class='${k.color}'>${k.color}</b> blocked on `);
    }, 1000);
}

chessAPI.on_draw = function() {
    if (intro_mode) {return false}
    setTimeout(function() {
        show_message("<h2>Draw...</h2><p>no progress for the last " + chessAPI.game.auto_draw_after + " moves.</p>");
        board.addEventListener("mousemove", board_initial_hover);
        clearTimeout(status_ud_timeout);
        update_game_status("Draw on ");
    }, 1000);
}

chessAPI.on_await_promotion = function(HTML_p, p, HTML_s, s) {

    piece_to_promote = p;

    promo_timeout = setTimeout(function() {

        let promo_options = document.querySelector(".promo_options." + p.color);
        promo_options.classList.add("shown");

        IDIOTCHESS.promote_if_allowed(p);

    }, piece_move_duration);
}

chessAPI.on_promoted = function(HTML_p, p, type, HTML_s, s) {

    let promo_options = document.querySelector(".promo_options." + p.color);
    promo_options.classList.remove("shown");

    HTML_p.style.backgroundImage = "url(images/" + p.color + "_" + type + ".png)";

}

for (promo_o of document.querySelectorAll(".option")) {
    promo_o.onclick = function() {
        piece_to_promote?.promote(this.getAttribute("data-type"));
        piece_to_promote = false;
    }
}


/*** SPECIAL FX ***/

function ghost_fx(html_p, html_s, taken = false) {
   
    let delay1 = 50, delay2 = 550;

    if (taken) {
        delay1 = 410;
        delay2 = 910;
    }

    let ghost_p = document.createElement('div');
    ghost_p.className = "ghost_piece";
    ghost_p.style.left = html_s.style.left;
    ghost_p.style.top = html_s.style.top;
    ghost_p.style.backgroundImage = html_p.style.backgroundImage;
    board.append(ghost_p);

    if (taken) {
        setTimeout(function() { ghost_p.classList.add("dark_bg"); }, 260);
    }

    setTimeout(function() { ghost_p.classList.add("fading"); }, delay1);
    setTimeout(function() { ghost_p.remove(); }, delay2);
}

function check_fx(elem_p) {
    let bubble = document.createElement('div');
    bubble.className = "check_fx";
    bubble.style.left = (elem_p.offsetLeft + 15) + "px";
    bubble.style.top = (elem_p.offsetTop + 15) + "px";
    board.append(bubble);
    bubble.innerHTML = "!";
    setTimeout(function() { bubble.classList.add("moving"); }, 10);
    setTimeout(function() { bubble.classList.add("fading"); }, 210);
    setTimeout(function() { bubble.remove(); }, 710);
}


/*** MENU / MESSAGE / CREDITS ***/

function show_menu(elem, force = false) {
    overlay.classList.add("shown");
    elem.classList.add("shown");
    if (force === true) {
        forced_menu = true;
        overlay.classList.add("force_blur_fx");
    }
}

function hide_menu(elem, keep_overlay = false) {
    elem.classList.remove("shown");

    if (!keep_overlay) {
        overlay.classList.remove("shown");
        overlay.classList.remove("force_blur_fx");
        forced_menu = false;
    }
}

function show_message(content) {
    overlay.classList.add("shown");
    overlay.classList.add("force_blur_fx");
    message.classList.add("shown");
    message.querySelector("header").innerHTML = content;
}

function hide_message() {
    overlay.classList.remove("force_blur_fx");
    message.classList.remove("shown");
}

message_confirm.onclick = function() {
    hide_message();
    show_menu(menu);
}

credits_confirm.onclick = function(){hide_menu(credits)};
show_credits_btn.onclick = function(){hide_menu(menu); show_menu(credits, true)};

window.addEventListener("keydown",function(e){
    if (e.key == "Escape" && !intro_mode && chessAPI.game.active) {
        if (!forced_menu) {
            hide_menu(credits);
            show_menu(menu, true);
        } else {
            hide_menu(menu);
        }
    }
});

function board_initial_hover() { show_menu(menu); }


/*** INTRO SCREEN ***/

function write_in_square(s_x, s_y, content) {
    let s = chessAPI.board.get_square(s_x, s_y);
    s.html.innerHTML = "<span class = 'caption'>" + content + "</span>";
}

function write_intro() {

    write_in_square(0, 3, "I");
    write_in_square(1, 3, "D");
    write_in_square(2, 3, "I");
    write_in_square(3, 3, "O");
    write_in_square(4, 3, "T");
    write_in_square(3, 4, "C");
    write_in_square(4, 4, "H");
    write_in_square(5, 4, "E");
    write_in_square(6, 4, "S");
    write_in_square(7, 4, "S");

    for (let s of chessAPI.board.squares_1d) {
        setTimeout(function() {
            remove_intro_char(s.html);
        }, 10000 + Math.round(Math.random() * 2000));
    }

}

function remove_intro_char(s) {

    let caption = s.querySelector(".caption");
    if (caption) {

        caption.style.opacity = 0;

        setTimeout(function() {
            caption.remove();
        }, 3500);
    }
}


/*** CLEAR / START GAME ***/

function clear_game() {
    
    chessAPI.game.active = false;
    clearTimeout(promo_timeout);
    clearTimeout(status_ud_timeout);

    for (let promo_options of document.querySelectorAll(".promo_options")) {
        promo_options.classList.remove("shown");
    }

    board.classList.add("refreshing");
    
    setTimeout(function(){
        board.classList.remove("refreshing");
        clearTimeout(IDIOTCHESS.timeout);
        chessAPI.game.clear();
    },500);
}

function start_new_game(callback = function(){}) {

    board.removeEventListener("mousemove", board_initial_hover);
    
    clear_game();
    hide_menu(menu);
    intro_mode = false;
    clear_game_status();
    setTimeout(function(){
        callback();
        chessAPI.game.start();
    },500);
}

PvsCPU_btn.onclick = function(){
    start_new_game(function(){
        IDIOTCHESS.is_player = ["black"];
        IDIOTCHESS.base_reflection_delay = 1000;
        IDIOTCHESS.reflection_delay_amplitude = 1000;
        IDIOTCHESS.selection_fx_delay = 250;
    });
};

CPUvsCPU_btn.onclick = function(){
    start_new_game(function(){
        IDIOTCHESS.is_player = ["white","black"];
        IDIOTCHESS.base_reflection_delay = 1000;
        IDIOTCHESS.reflection_delay_amplitude = 1000;
        IDIOTCHESS.selection_fx_delay = 250;
    });
};


/*** GAME STATUS DISPLAY ***/

function update_game_status(custom_msg = false) {
    if (custom_msg === false) {
        game_status.innerHTML = `<b class='${chessAPI.game.current_player}'>${chessAPI.game.current_player}</b> to play (move <b class='${chessAPI.game.current_player}'>${chessAPI.game.current_move}</b>)`;
    } else {
        game_status.innerHTML = custom_msg + "move <b>" + chessAPI.game.current_move + "</b>";
    }
}

function clear_game_status() {
    game_status.innerHTML = "";
}