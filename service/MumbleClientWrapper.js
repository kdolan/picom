const mumble = require('mumble');
const log = require('loglevel');
const  EventEmitter = require('events');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");

const RETRY_LIMIT=1000;

class MumbleClientWrapper extends EventEmitter{
    constructor({server, port, username, key, cert}) {
        super();

        this.config = {
            server,
            options: {
                port,
                key,
                cert
            },
            username
        }
    }

    async connect(){
        return new Promise((resolve, reject) => {
            log.info( `Connecting to ${this.config.server}` );

            mumble.connect( this.config.server, this.config.options,  ( error, connection ) => {
                if( error )
                    return reject(new Error( error ? error : "Unknown Connection Error"));

                log.info( `Connected to ${this.config.server}. Waiting for connection to be ready...` );
                this.connection = connection;

                connection.authenticate( this.config.username, null );

                connection.on( 'initialized', () => {
                    log.info( `Connection to ${this.config.server} is ready to use` );

                    connection.on( 'voice', (data) => this._onVoice(data) );
                    connection.on( `message`, (message, user, scope) => this._onMessage(message, user, scope));

                    resolve();
                } );
            });
        });
    }

    async disconnect(){
        log.info( `Disconnecting from ${this.config.server}` );
        this.connection.disconnect();
    }

    async joinChannel(name){
        return new Promise((resolve, reject) => {
            try {
                const channel = this.connection.channelByName(name);
                if (!channel) {
                    log.error(`Error joining channel '${name}'. It does not exist`);
                    reject(new ErrorWithStatusCode({message: "Channel does not exist", code: 404}));
                    return;
                }
                channel.join();

                let retryCount = 0;
                const whileLoop = () => {
                    retryCount++;
                    if (channel.id !== this.connection.user.channel.id) {
                        if (retryCount > RETRY_LIMIT)
                            reject({message: "Max retry exceeded"});
                        setTimeout(whileLoop, 0);
                    } else
                        resolve(channel);
                };
                whileLoop();
            }
            catch (e) {
                log.error(`Error joining channel`, e);
                reject(e);
            }
        });
    }

    sendMessageToCurrentChannel(message){
        const currentCh = this.connection.user.channel;
        log.info(`Sending message to ${currentCh.name}: ${message}`);
        currentCh.sendMessage(message);
    }

    playReadableStream(readableStream){
       const stream = this.connection.inputStream({
            signed: true,
            bitDepth: 16,
            sampleRate: 48000
        });
        readableStream.pipe(stream)
    }

    _onMessage(message, user, scope){
        log.debug(`New Message from ${user.name} in ${scope}: ${message}`);
        this.emit('message', {message, user, scope});
    }

    _onVoice(voice){
        log.debug(`Received Voice - Data Length: ${voice.length}`);
        this.emit('voice', voice);
    }
}

module.exports.MumbleClientWrapper = MumbleClientWrapper;