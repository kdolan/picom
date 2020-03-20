class MumbleChannelInfo{
    constructor(rawChannel) {
        this.name = rawChannel.name;
        this.id = rawChannel.id;
        this._parent = rawChannel.parent ? new MumbleChannelInfo(rawChannel.parent) : null;
    }

    get path(){
        if(!this._parent)
            return this.name;
        return `${this._parent.path}/${this.name}`;
    }
}

module.exports.MumbleChanelInfo = MumbleChannelInfo;