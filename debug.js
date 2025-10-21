/*** DEBUG MODE ***/

// chessAPI.click_on_piece = chessAPI.click_on_playable_piece;

// chessAPI.on_square_playable = function(elem_s, elem_occupying_p) {
//     elem_s.style.backgroundImage = "url(images/square_ok.png)";
// }

// chessAPI.on_square_playable_revert = function(elem_s, elem_occupying_p) {
//     elem_s.style.backgroundImage = "";
// }

function start_debug_game() {
    start_new_game(function(){

    // MANUAL DEBUG
        //IDIOTCHESS.is_player = [];
        // IDIOTCHESS.base_reflection_delay = 500;
        // IDIOTCHESS.reflection_delay_amplitude = 0;
        // IDIOTCHESS.selection_fx_delay = 250;

    // OBSERVATION
        // IDIOTCHESS.is_player = ["white","black"];
        // IDIOTCHESS.base_reflection_delay = 0;
        // IDIOTCHESS.reflection_delay_amplitude = 0;
        // IDIOTCHESS.selection_fx_delay = 250;

    // SUPERFAST BUG EMERGENCE
        IDIOTCHESS.is_player = ["white","black"];
        IDIOTCHESS.base_reflection_delay = 0;
        IDIOTCHESS.reflection_delay_amplitude = 0;
        IDIOTCHESS.selection_fx_delay = 0;

    }); 
}

function hurry() {
    IDIOTCHESS.base_reflection_delay = 600;
    IDIOTCHESS.reflection_delay_amplitude = 0;
}

function HURRY() {
    IDIOTCHESS.base_reflection_delay = 0;
    IDIOTCHESS.reflection_delay_amplitude = 0;
    IDIOTCHESS.selection_fx_delay = 100;
}