$(document).ready(function() {
    createGame = function(username) {
        var port_audio = new Audio('portal.wav');
        var trap_audio = new Audio('trap.wav');
        var position = [7, 8]; //[x, y]
        var playing = true;

        //Získá od serveru
        var traps = [ ];
        var portals = [ ];
        var end = {x: 0, y: 0};
        var map = [];

        var tiles = [
            '/tiles/wall.png',
            '/tiles/dirt.png',
            '/tiles/spawn.png',
            '/tiles/port.png',
            '/tiles/end.png'
        ];

        var player_cids = [ ];
        var players_xy = [ ];

        var another_player = '/pmp.png';
        var empty_tile = '/tiles/empty.png';

        var eleView = {
            center: $('#tile_center'),
            center_right: $('#tile_center_right'),
            center_left: $('#tile_center_left'),

            center_up: $('#tile_center_up'),
            center_up_right: $('#tile_center_up_right'),
            center_up_left: $('#tile_center_up_left'),

            center_down: $('#tile_center_down'),
            center_down_right: $('#tile_center_down_right'),
            center_down_left: $('#tile_center_down_left')
        };

        var elePlayerView = {
            cr: $('#tile_cr_player'),
            cl: $('#tile_cl_player'),

            cu: $('#tile_u_player'),
            cur: $('#tile_ur_player'),
            cul: $('#tile_ul_player'),

            cd: $('#tile_d_player'),
            cdr: $('#tile_dr_player'),
            cdl: $('#tile_dl_player')
        };

        var draw = function () {
            eleView.center_left.attr('src', tiles[map[position[1]][position[0] - 1]]);
            eleView.center.attr('src', tiles[map[position[1]][position[0]]]);
            eleView.center_right.attr('src', tiles[map[position[1]][position[0] + 1]]);

            eleView.center_up_left.attr('src', tiles[map[position[1] + 1][position[0] - 1]]);
            eleView.center_up.attr('src', tiles[map[position[1] + 1][position[0]]]);
            eleView.center_up_right.attr('src', tiles[map[position[1] + 1][position[0] + 1]]);

            eleView.center_down_left.attr('src', tiles[map[position[1] - 1][position[0] - 1]]);
            eleView.center_down.attr('src', tiles[map[position[1] - 1][position[0]]]);
            eleView.center_down_right.attr('src', tiles[map[position[1] - 1][position[0] + 1]]);
            drawPlayers();
        };

        var drawPlayers = function() {
            var pcid = player_cids;
            for (var i = 0; i < pcid.length; i++) {
                var cid = player_cids[i];
                //Center Left
                if (players_xy[cid].x == position[0] - 1 && players_xy[cid].y == position[1]) {
                    elePlayerView.cl.attr('src', another_player);
                }
                else {
                    elePlayerView.cl.attr('src', empty_tile);
                }
                //Center Right
                if (players_xy[cid].x == position[0] + 1 && players_xy[cid].y == position[1]) {
                    elePlayerView.cr.attr('src', another_player);
                }
                else {
                    elePlayerView.cr.attr('src', empty_tile);
                }

                //Up
                if (players_xy[cid].x == position[0] && players_xy[cid].y == position[1] + 1) {
                    elePlayerView.cu.attr('src', another_player);
                }
                else {
                    elePlayerView.cu.attr('src', empty_tile);
                }
                //Up Left
                if (players_xy[cid].x == position[0] - 1 && players_xy[cid].y == position[1] + 1) {
                    elePlayerView.cul.attr('src', another_player);
                }
                else {
                    elePlayerView.cul.attr('src', empty_tile);
                }
                //Up Right
                if (players_xy[cid].x == position[0] + 1 && players_xy[cid].y == position[1] + 1) {
                    elePlayerView.cur.attr('src', another_player);
                }
                else {
                    elePlayerView.cur.attr('src', empty_tile);
                }

                //Down
                if (players_xy[cid].x == position[0] && players_xy[cid].y == position[1] - 1) {
                    elePlayerView.cd.attr('src', another_player);
                }
                else {
                    elePlayerView.cd.attr('src', empty_tile);
                }
                //Down Left
                if (players_xy[cid].x == position[0] - 1 && players_xy[cid].y == position[1] - 1) {
                    elePlayerView.cdl.attr('src', another_player);
                }
                else {
                    elePlayerView.cdl.attr('src', empty_tile);
                }
                //Down Right
                if (players_xy[cid].x == position[0] + 1 && players_xy[cid].y == position[1] - 1) {
                    elePlayerView.cdr.attr('src', another_player);
                }
                else {
                    elePlayerView.cdr.attr('src', empty_tile);
                }
            }
        };

        var move = function (dir) {
            if (canMove(dir)) {
                switch (dir) {
                    case 'up':
                        position[1]++;
                        break;
                    case 'down':
                        position[1]--;
                        break;
                    case 'right':
                        position[0]++;
                        break;
                    case 'left':
                        position[0]--;
                        break;
                }
            }
            draw();
        };

        var canMove = function (dir) {
            var nextYX = [0, 0];
            switch (dir) {
                case 'up':
                    nextYX = [position[1] + 1, position[0]];
                    break;
                case 'down':
                    nextYX = [position[1] - 1, position[0]];
                    break;
                case 'right':
                    nextYX = [position[1], position[0] + 1];
                    break;
                case 'left':
                    nextYX = [position[1], position[0] - 1];
                    break;
            }
            var nextTile = map[nextYX[0]][nextYX[1]];

            if (nextTile == 4) {
                if (nextYX[0] == end.y && nextYX[1] == end.x) {
                    sendMessage({action: 'sendMsg', msg: 'win'});
                }
                else {
                    sendMessage({action: 'sendMsg', msg: 'badEnd'});
                }
            }
            if (nextTile == 3) {
                for (var i = 0; i < portals.length; i++) {
                    if (portals[i].x1 == nextYX[1] && portals[i].y1 == nextYX[0]) {
                        position = [portals[i].x2, portals[i].y2];
                        port_audio.play();
                        sendMessage({action: 'move', x: portals[i].x2, y: portals[i].y2});
                        return false;
                    }
                    if (portals[i].x2 == nextYX[1] && portals[i].y2 == nextYX[0]) {
                        position = [portals[i].x1, portals[i].y1];
                        port_audio.play();
                        sendMessage({action: 'move', x: portals[i].x1, y: portals[i].y1});
                        return false;
                    }
                }
            }
            for (var i = 0; i < traps.length; i++) {
                if (traps[i].x == nextYX[1] && traps[i].y == nextYX[0]) {
                    position = [7, 8];
                    trap_audio.play();
                    sendMessage({
                        action: 'sendMsg',
                        msg: 'trap'
                    });
                    sendMessage({action: 'move', x: 7, y: 8});
                    return false;
                }
            }

            if (nextTile != 0) { sendMessage({action: 'move', x: nextYX[1], y: nextYX[0]}); }
            return nextTile != 0;
        };

        startGame = function () {
            draw();
            if (playing) {
                keyboard();
            }
            else {
                playing = true;
            }
        };

        var keyboard = function () {
            $(document).on('keypress', function (e) {
                if (playing) {
                    switch (e.keyCode) {
                        //wasd
                        case 119:
                            move('up');
                            break;
                        case 115:
                            move('down');
                            break;
                        case 100:
                            move('right');
                            break;
                        case 97:
                            move('left');
                            break;
                        //WASD
                        case 87:
                            move('up');
                            break;
                        case 83:
                            move('down');
                            break;
                        case 68:
                            move('right');
                            break;
                        case 65:
                            move('left');
                            break;
                        //šipky
                        case 38:
                            move('up');
                            break;
                        case 40:
                            move('down');
                            break;
                        case 39:
                            move('right');
                            break;
                        case 37:
                            move('left');
                            break;
                    }
                }
            });
        };

        var reloadChat = function(content) {
            $('#game_log').html(content);
        };

        //Sockety
        var socket = new WebSocket("ws://78.156.39.228:3334/");
        //var socket = new WebSocket("ws://localhost:3334/");
        var cid = null;

        socket.onopen = function () {
            console.log('Zahájena socketová komunikace...');
            var data = {
                action: 'reg',
                name: username
            };
            sendMessage(data);
        };

        socket.onmessage = function (message) {
            try {
                var json = JSON.parse(message.data);
                process(json);
            }
            catch (e) {
                console.log(e);
            }
        };

        socket.onclose = function () {
            console.log('Spojení uzavřeno.');
        };

        /**
         * Zpracování zprávy od serveru
         * @param data Parsed JSON
         */
        var process = function (data) {
            console.log('Action: ' + data.action);
            switch (data.action) {
                case 'cid':
                    cid = data.cid;
                    console.log('Aktuální Client ID: ' + cid);
                    setTimeout(function() {
                        if (end.x == 0 && end.y == 0) {
                            sendMessage({action: 'getMap'});
                        }
                    }, 1000);
                    break;
                case 'getMap':
                    map = data.map;
                    traps = data.traps;
                    portals = data.portals;
                    end = data.end;
                    startGame();
                    sendMessage({action: 'getChat'});
                    break;
                case 'reloadChat':
                    reloadChat(data.content);
                    break;
                case 'win':
                    playing = false;
                    reloadChat(data.content);
                    break;
                case 'newGame':
                    window.location.reload();
                    break;
                case 'player_move':
                    console.log(data);
                    if (player_cids.indexOf(data.p_cid) == -1) {
                        player_cids.push(data.p_cid);
                    }
                    players_xy[data.p_cid] = {x: data.x, y: data.y};
                    drawPlayers();
                    break;
            }
        };

        /**
         * Odeslání zprávy serveru
         * @param data JSON
         */
        sendMessage = function (data) {
            data.cid = cid;
            socket.send(JSON.stringify(data));
        };
    };
});