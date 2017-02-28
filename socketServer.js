var ws = require('websocket.io')
    , server = ws.listen(3334);

var Client = function(name, socket) {
    return {
        username: name,
        socket: socket,
        x: 7,
        y: 8
    };
};

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

var ends = [
    [1, 1],
    [1, 6],
    [11, 1],
    [11, 14]
];

var END_tile = {x: 0, y: 0};
var clients = [ ];
/*
 * Wall  - 0
 * Floor - 1
 * Spawn - 2
 * Port  - 3
 * End   - 4
 *
 * Používá se map[y][x];
 */
var map_template = [
    //0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5 x | y
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //0
    [0, 1, 1, 0, 1, 1, 1, 1, 1, 3, 0, 1, 1, 1, 3, 0], //1
    [0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0], //2
    [0, 1, 0, 0, 1, 1, 1, 1, 3, 0, 1, 0, 1, 0, 0, 0], //3
    [0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0], //4
    [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0], //5
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0], //6
    [0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0], //7
    [0, 1, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 0], //8
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 3, 0, 0], //9
    [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0], //10
    [0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0], //11
    [0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0], //12
    [0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0], //13
    [0, 3, 1, 1, 1, 1, 1, 1, 0, 3, 1, 1, 1, 0, 1, 0], //14
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  //15
];

var map = [ ];

var traps = [
    {x: 3, y: 7},
    {x: 4, y: 13},
    {x: 6, y: 2},
    {x: 10, y: 2},
    {x: 11, y: 10},
    {x: 13, y: 6},
    {x: 14, y: 13}
];

var portals = [
    {x1: 9, y1: 1, x2: 13, y2: 9},
    {x1: 8, y1: 3, x2: 14, y2: 1},
    {x1: 1, y1: 14, x2: 9, y2: 14}
];

var chat_log = '';

server.on('connection', function (socket) {
    socket.on('message', function (message) {
        try {
            var json = JSON.parse(message);
            process(json, socket);
        }
        catch (e) {
            console.log(e.message);
        }
    });
    socket.on('close', function () {
        clearUserList(socket);
    });
    socket.on('error', function(error) {
        console.log(error);
    });
});

/**
 * Zpracování zprávy od klienta
 * @param data Parsed JSON
 * @param socket
 */
var process = function(data, socket) {
    console.log('Action: '+data.action);
    switch(data.action) {
        case 'reg':
            var cid = clients.push(Client(data.name, socket)) - 1;
            sendMessage(socket, {action: 'cid', cid: cid});
            if (END_tile.x == 0 && END_tile.y == 0 || clients == [ ]) {
                newGame();
            }
            sendMap(socket);
            //chat_log = '<li class="media"><div class="media-left"><img src="tiles/server.png" /></div><div class="media-body">'+data.name+' se připojil ze hry.</div> </li>' + chat_log;
            //broadcast(-1, {action: 'reloadChat'});
            break;
        case 'move':
            clients[data.cid].x = data.x;
            clients[data.cid].y = data.y;
            broadcast(data.cid, {action: 'player_move', p_cid: data.cid, x: data.x, y: data.y});
            break;
        case 'getMap':
            sendMap(socket);
            break;
        case 'getChat':
            sendMessage(socket, {action: 'reloadChat', content: chat_log})
            break;
        case 'sendMsg':
            sendMsg(socket, data.msg, data.cid);
            broadcast(-1, {action: 'reloadChat', content: chat_log});
            break;
        default:
            console.log('Undefined action: '+data.action);
            break;
    }
};

var sendMsg = function(socket, msg, cid) {
    if (msg == 'trap') {
        chat_log = '<li class="media"><div class="media-left"><img src="tiles/trap.png" /></div><div class="media-body"><b>'+clients[cid].username+'</b> byl usmrcen dábělskou pastí.</div></li>' + chat_log;
    }
    else if (msg == 'win') {
        chat_log = '<li class="media"><div class="media-left"><img src="tiles/bot.png" /></div><div class="media-body"><b>'+clients[cid].username+'</b> vyhrál hru, za okamžik započne nové kolo.</div></li>' + chat_log;
        broadcast(-1, {action: 'win'});
        setTimeout(function() {
            newGame();
        }, 4000);
    }
    else if (msg == 'badEnd') {
        chat_log = '<li class="media"><div class="media-left"><img src="tiles/bot.png" /></div><div class="media-body"><b>'+clients[cid].username+'</b> našel falešný východ. Jen hledej dál...</div></li>' + chat_log;
    }
    else {
        chat_log = '<li class="media"><div class="media-left"><b>'+clients[cid].username+':</b></div><div class="media-body">'+msg+'</div> </li>' + chat_log;
    }
};

var setEnd = function() {
    var e = ends[getRndInteger(0, 3)];
    END_tile = {x: e[0], y: e[1]};
    map = map_template;
    map[e[1]][e[0]] = 4;
    console.log('End = ['+e[0]+'; '+e[1]+']');
};

var sendMap = function(socket) {
    var data = {
        'action': 'getMap',
        'map': map,
        'end': END_tile,
        'traps': traps,
        'portals': portals
    };
    sendMessage(socket, data);
};

var newGame = function() {
    chat_log = '<li class="media"><div class="media-left"><img src="tiles/server.png" /></div><div class="media-body">Byla zahájena nová hra.</div> </li>';
    setEnd();
    var data = END_tile;
    data.action = 'newGame';

    broadcast(-1, data);
};

var broadcast = function(ex_id, data) {
    for (var i = 0; i < clients.length; i++) {
        if (clients[i] != undefined) {
            if (i != ex_id) {
                clients[i].socket.send(JSON.stringify(data));
            }
        }
    }
};

/**
 * Odeslání zprávy klientovi
 * @param socket
 * @param data JSON
 */
sendMessage = function(socket, data) {
    socket.send(JSON.stringify(data));
};

var clearUserList = function(socket) {
    var allUndefined = true;
    for (var i = 0; i < clients.length; i++) {
        if (clients[i] != undefined) {
            if (clients[i].socket == socket) {
                //chat_log = '<li class="media"><div class="media-left"><img src="tiles/server.png" /></div><div class="media-body">'+clients[i].username+' se odpojil ze hry.</div> </li>' + chat_log;
                //broadcast(-1, {action: 'reloadChat'});
                //clients.splice(i, 1);
                clients[i] = undefined;
            }
        }
        if (allUndefined == true) {
            allUndefined = (clients[i] == undefined);
        }
    }

    if (allUndefined) {
        console.log('All Client disconnect - clear client list');
        clients = [ ];
    }
};