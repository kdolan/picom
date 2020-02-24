require('dotenv').config();

const mumble = require('mumble'),
    fs = require('fs');

const screamSteam = fs.createReadStream('./sounds/falling.wav');

const options = {
    key: fs.readFileSync( './cert/key.pem' ),
    cert: fs.readFileSync( './cert/cert.pem' ),
    port: 64738
};

let globalCon;
console.log( 'Connecting' );
mumble.connect( process.env.MUMBLE_SERVER, options, function ( error, connection ) {
    if( error ) { throw new Error( error ); }

    console.log( 'Connected' );

    connection.authenticate( 'GhostUser', null );
    connection.on( 'initialized', onInit );
    connection.on( 'voice', onVoice );
    connection.on( `message`, onMessage);

    const channel = connection.channelByName("AFK");
    globalCon = connection;
});

function onInit() {
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
    //setTimeout(() => screamSteam.pipe(stream), 10000);
    //Loopback
    ///setTimeout(() => globalCon.outputStream().pipe(delay(3000)).pipe(globalCon.inputStream() ), 15000);
}

function onVoice( voice ) {
    console.log( 'Mixed voice' );
    var pcmData = voice;
}

function onMessage(message, user, scope){
    console.log(`New Message from ${user.name} in ${scope}: ${message}`);
}