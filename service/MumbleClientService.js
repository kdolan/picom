const mumble = require('mumble');
const log = require('loglevel');
const  EventEmitter = require('events');

const RETRY_LIMIT=100000;

class MumbleClientService extends EventEmitter{
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
                    resolve();
                } );

                connection.on( 'voice', this._onVoice );
                connection.on( `message`, this._onMessage);
            });
        })
    }

    async joinChannel(name){
        return new Promise((resolve, reject) => {
            const channel = this.connection.channelByName(name);
            if(!channel){
                reject({message: "Channel does not exist"});
                return;
            }
            channel.join();

            let retryCount = 0;
            const whileLoop  = () => {
                retryCount++;
                if(channel.id !== this.connection.user.channel.id) {
                    if(retryCount > RETRY_LIMIT)
                        reject({message: "Max retry exceeded"});
                    setTimeout(whileLoop, 0);
                }
                else
                    resolve(channel);
            };
            whileLoop();
        });
    }

    sendMessageToCurrentChannel(message){
        const currentCh = this.connection.user.channel;
        log.info(`Sending message to ${currentCh.name}: ${message}`);
        currentCh.sendMessage(message);
    }

    _onMessage(message, user, scope){
        log.debug(`New Message from ${user.name} in ${scope}: ${message}`);
        this.emit('message', {message, user, scope});
    }

    _onVoice(voice){
        this.emit('voice', voice);
    }
}

module.exports.MumbleClientService = MumbleClientService;