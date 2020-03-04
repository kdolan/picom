const mumble = require('mumble');
const log = require('loglevel');
const  EventEmitter = require('events');
const {ErrorWithStatusCode} = require("../obj/ErrorWithStatusCode");

const RETRY_LIMIT=1000;

class MumbleClientWrapper extends EventEmitter{
    constructor({server, port, username, key, cert}) {
        super();

        this._connected = false;
        this._connectCalled = false;

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

    get status(){
        return {
            connected: this._connected,
            connectionAttempted: this._connectCalled
        };
    }

    async connect(){
        this._connectCalled = true;
        return new Promise((resolve, reject) => {
            log.info( `Connecting to ${this.config.server}` );

            mumble.connect( this.config.server, this.config.options,  ( error, connection ) => {
                if( error )
                    return reject(new ErrorWithStatusCode( {code: 500, message: "Mumble Connection Error", innerError: error}));

                log.info( `Connected to ${this.config.server}. Waiting for connection to be ready...` );
                this.connection = connection;

                connection.authenticate( this.config.username, null );

                connection.on('error', (err) => {
                    log.error( `Mumble Connection Failed - Error Establishing Mumble Connection`, err );
                    reject(new ErrorWithStatusCode( {code: 500, message: "Mumble Connection Error", innerError: error}));
                });

                connection.on( 'initialized', () => {
                    log.info( `Connection to ${this.config.server} is ready to use` );

                    //Remove the local error listener above
                    connection.removeAllListener('error');

                    connection.on( 'voice', (data) => this._onVoice(data) );
                    connection.on( `message`, (message, user, scope) => this._onMessage(message, user, scope));
                    connection.on('error', error => this._onError(error));

                    this._connected = true;

                    resolve();
                } );
            });
        });
    }

    async disconnect(){
        this._connected = false;
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

    _onError(error){
        log.error(`Mumble Error - Connection Has Terminated Due to Error`, error);
        this.emit('error', new ErrorWithStatusCode({code: 500, innerError: error, message: "Mumble connection has terminated due to an error. Re-connect needed"}));
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