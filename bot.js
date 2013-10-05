// Our Twitter library
var Twit = require('twit');
var $ = require('cheerio');
var request = require('request');
var express = require("express");
var _ = require("underscore");

if (process.env.REDISTOGO_URL) {
// TODO: redistogo connection
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);

  redis.auth(rtg.auth.split(":")[1]); 
} else {
  var redis = require("redis").createClient();
}

redis.on("error", function (err) {
  console.log("Error " + err);
});

var app = express();
app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

// We need to include our configuration file
var T = new Twit(require('./config.js'));

// This is the URL of a search for the latest tweets on the '#mediaarts' hashtag.
var mediaArtsSearch = {q: "#yolo", count: 10, result_type: "recent"}; 

var domain = 'https://news.google.com/'

// This function finds the latest tweet with the #mediaarts hashtag, and retweets it.
function retweetLatest() {
	T.get('search/tweets', mediaArtsSearch, function (error, data) {
	  // If our search request to the server had no errors...
    console.log(error, data);
	  if (!error) {
	  	// ...then we grab the ID of the tweet we want to retweet...
		var retweetId = data.statuses[0].id_str;
    retweet(retweetId);
		// ...and then we tell Twitter we want to retweet it!
	  }
	  // However, if our original search request had an error, we want to print it out here.
	  else {
	  	console.log('There was an error with your hashtag search:', error);
	  }
	});
}

function tweet(text) {
  T.post('statuses/update', {status: text }, function (error, response) {
    if (response) {
      console.log('Success! Check your bot, it should have retweeted something.')
    }
    // If there was an error with our Twitter call, we print it out here.
    if (error) {
      console.log('There was an error with Twitter:', error);
    }
  })
}

function retweet(retweetId) {
  T.post('statuses/retweet/' + retweetId, { }, function (error, response) {
    if (response) {
      console.log('Success! Check your bot, it should have retweeted something.')
    }
    // If there was an error with our Twitter call, we print it out here.
    if (error) {
      console.log('There was an error with Twitter:', error);
    }
  })
}

function gotHTML(err, resp, html) {
  if (err) return console.error(err);
  var parsedHTML = $.load(html);
  // get all img tags and loop over them
  var headers = [];
  _.values(parsedHTML('.titletext')).forEach(function(link) {
    var text = $(link).text();
    console.log(text);
    headers.push(text)
  });
  var randomIndex = Math.floor(Math.random() * headers.length);
  console.log("random:")
  console.log(headers[randomIndex]);
  tweet(headers[randomIndex] + " ...in bed");

}

function getTweet() {
  request(domain, gotHTML)
}

// Try to retweet something as soon as we run the program...
getTweet();
//retweetLatest();
// ...and then every hour after that. Time here is in milliseconds, so
// 1000 ms = 1 second, 1 sec * 60 = 1 min, 1 min * 60 = 1 hour --> 1000 * 60 * 60
setInterval(getTweet, 1000 * 60 * 60);

