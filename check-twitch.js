require("sugar");
var TwitchClient = require("node-twitchtv");
var account = require("./user.json");
var fs = require("fs");
var irc = require("irc");

var ircDetails = require("./irc.json");
var client = new TwitchClient(account);
var users = ["gordallott", "Thinaran", "ChemiKhazi", "btsierra"]

var IsStreaming = function (username, cb) {
	
	client.streams({channel: username}, function (err, resp) {
		if (resp.hasOwnProperty("stream")) {
			cb(resp.stream);
		}
		else {
			cb(null);
		}
	});
}

var results = {}
var userCtr = 0;

var checkUser = function(index, cb) {
	
	IsStreaming(users[index], function(stream) {
		if (stream !== null) {
			results[stream.channel.display_name] = stream;
		}
		
		userCtr++;
		if (userCtr < users.length) {
			checkUser(userCtr, cb);
		}
		else {
			cb (results);
		}
	});
}

// g enerate new cache list
checkUser(userCtr, function (streams) { 
	var cachedStreams = {}
	try {
		cachedStreams = JSON.parse(fs.readFileSync('streamCache.json', 'utf8'));
	} 
	catch (err) {
	}
	
	var foundItems = [];

	Object.values(streams).each(function (stream) {
		if (Object.values(cachedStreams).none(function (n) { return (stream.created_at === n.created_at); })) {
			foundItems.push(stream.channel.display_name + " has gone live! playing " + stream.game + " at " + stream.channel.url);
		}
	});

	foundItems.each(function (v) { console.log(v); });
	fs.writeFileSync('streamCache.json', JSON.stringify(streams), 'utf8');

	if (foundItems.length > 0) {
		var ircClient = new irc.Client('rafiki.local', 'gord', Object.merge(ircDetails, {autoConnect:false}));
		ircClient.connect(function () {
			foundItems.each(function (announce) {
				console.log("sending to irc: " + announce);
				ircClient.say("#abandongames", announce);
			});

			ircClient.disconnect();
	
		});

	}

});



