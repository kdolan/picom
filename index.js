require('dotenv').config();
const delay = require('delay-stream');

const mumble = require('mumble'),
    fs = require('fs');

const screamSteam = fs.createReadStream('./sounds/falling.wav');

var options = {
    key: fs.readFileSync( 'cert/key.pem' ),
    cert: fs.readFileSync( 'cert/cert.pem' ),
    port: 36001
};

let globalCon;
console.log( 'Connecting' );
mumble.connect( process.env.MUMBLE_SERVER, options, function ( error, connection ) {
    if( error ) { throw new Error( error ); }

    console.log( 'Connected' );

    connection.authenticate( 'GhostUser' );
    connection.on( 'initialized', onInit );
    connection.on( 'voice', onVoice );

    const channel = connection.channelByName("AFK");
    globalCon = connection;
});

var onInit = function() {
    // Connection is authenticated and usable.
    console.log( 'Connection initialized' );
    const AFK = globalCon.channelByName("Landing Channel");
    AFK.join();
    AFK.sendMessage("The Ghost User from NodeJs is hear to murder you");

    stream = globalCon.inputStream({
        signed: true,
        bitDepth: 16,
        sampleRate: 48000
    });
    setTimeout(() => screamSteam.pipe(stream), 10000);
    setTimeout(() => globalCon.outputStream().pipe(delay(3000)).pipe(globalCon.inputStream() ), 15000);
};

var onVoice = function( voice ) {
    console.log( 'Mixed voice' );

    var pcmData = voice;
};