let controller = {};
module.exports = controller;
const MumbleChannelInfo = require('../domain/MumbleChannelInfo').MumbleChanelInfo;

controller.renderAdminUiRoute = function (req, res) {
    res.render('admin.njk', {config: req.piCom.mumbleConfig, ...getMumbleData(req.piCom)});
};

function getMumbleData(piCom) {
    if(!piCom.mumble.status.connected)
        return {channels: [], currentChannel: {}};

    const rawChannels = getAllChannelChildren(piCom.mumble.connection.rootChannel);
    const channels = rawChannels.map(c => new MumbleChannelInfo(c));
    const currentChannel = new MumbleChannelInfo(piCom.mumble.connection.user.channel);

    return {channels, currentChannel};
}

function getAllChannelChildren(channel) {
    let list = [channel];
    channel.children.forEach(c => {
        list = list.concat(getAllChannelChildren(c));
    });
    return list;
}
