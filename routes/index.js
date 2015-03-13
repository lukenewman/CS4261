var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

function createCompleteUrl(url, requestParams) {
	var requestUrl = url;

	var paramsString = '';
	for (var key in requestParams) {
		if (requestParams[key] !== undefined) {
			if (paramsString !== '') {
				paramsString += '&';
			}
			paramsString += key + '=' + requestParams[key];
		}
	}
	if (paramsString !== undefined) {
		requestUrl += '?' + paramsString;
	}
	return requestUrl;
}

/* GET yelp data */
router.get('/places', function(req, res, next) {

	var oauth = {
		consumer_key: 'ITZtXcKc38ITLI_nLh8ogg',
		consumer_secret: 'V2UPsiirFcVE0EziN8D7k3894qo',
		token: 'B_BSlUYZ7em3w9d7FBZqZHmzfciE8qpD',
		token_secret: '1imyzTp9XdNRnLtLsZXSLXH552M'
	};

	var url = 'http://api.yelp.com/v2/search';
	var requestParams = {
		ll: req.query.loc, // example: '49.0,6.10'
		radius_filter: req.query.radius, //example '1000'
		category_filter: req.query.section, // example 'restaurants'
		// complete list: http://www.yelp.com/
		// developers/documentation/v2/all_category_list
		sort: 2, // sort the business by Highest Rated
		limit: 20 //total number of business
	};

	var requestUrl = createCompleteUrl(url, requestParams);
	console.log('PLACES/ requestUrl: ' + requestUrl);

	request.get({url:requestUrl, oauth:oauth, json:true},function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body);
		}
		if (error) {
			console.error('Error: ' + error);
			console.log('Status Code: ' + response.statusCode);
			res.sendStatus(response.statusCode);
		}
	});
});

/*GET medias*/
router.get('/medias', function(req, res, next) {

	var twitterMedias = [];
	var instagramId = 0;
	var instagramMedias = [];

	var twitterOauth = {
		consumer_key: '7IYF9oKnPLDEta86RqtyehHVG',
		consumer_secret: 'a7WnvHk0fOlRSEuvGVgcIvO9gsiYgRNZWb0wrQgkL9RQAUaKpz',
		token: '3059932155-cle3iD7vkXjnd7bHHTPBMQrgVDv7YoFIxR2xx3t',
		token_secret: 'TkdySo3XL17tIi1jBcYwpOhsLPMgiyBE5BAjXUtu3xfQd'
	};

	async.parallel([
		//Make a request to the Twitter API
		function(callback) {
			console.log("Entered Twitter media task");
			var url = 'https://api.twitter.com/1.1/search/tweets.json';
			var requestParams = {
				q: req.query.q,
				geocode: req.query.loc + ',1km'
			};

			var requestUrl = createCompleteUrl(url, requestParams);
			console.log('MEDIA/TWITTER requestUrl: ' + requestUrl);

			request.get({url:requestUrl, oauth:twitterOauth, json:true},function (error, response, body) {
				if (!error && response.statusCode == 200) {
					twitterMedias = body.statuses;
				} else {
					console.error('Error: ' + error);
					console.log('Status Code: ' + response.statusCode);
				}
				callback();
			});

		},
		//Make a request to the Instagram API
		function(callback) {
			async.series([
				//Get the instagram ID of the place
				function(callback) {
					console.log("Entered Instagram ID task");
					var url = 'https://api.instagram.com/v1/locations/search';

					var requestParams = {
						lat: req.query.loc.split(',')[0],
						lng: req.query.loc.split(',')[1],
						client_id: 'c40df6cf23aa448c9c2da9007284f8e6'
					};

					var requestUrl = createCompleteUrl(url, requestParams);
					console.log('MEDIA/INSTAGRAM_ID requestUrl: ' + requestUrl);

					request.get(requestUrl, function(error, response, body) {
						if (!error && response.statusCode == 200) {
							body = JSON.parse(body);
							instagramId = body.data[0].id;
							console.log(instagramId);
						} else {
							console.error('Error: ' + error);
							console.log('Status code: ' + response.statusCode);
						}
						callback();
					});
				},
				//Get the instagram posts of the place
				function(callback) {
					console.log("Entered Instagram media task");
					//TODO WRONG REQUEST: to be corrected
					var url = 'https://api.instagram.com/locations/' + instagramId + '/media/recent';
					var requestParams = {
						client_id: 'c40df6cf23aa448c9c2da9007284f8e6'
					};

					var requestUrl = createCompleteUrl(url, requestParams);
					console.log('MEDIA/INSTAGRAM requestUrl: ' + requestUrl);

					request.get(requestUrl, function(error, response, body) {
						if (!error && response.statusCode == 200) {
							console.log(body);
							instagramMedias = body.data;
						} else {
							console.error('Error: ' + error);
							console.log('Status code: ' + response.statusCode);
						}
						callback();
					});
				}
			], callback); //Remember to put in the second series task's "task callback" as the "final callback" for the async.parallel operation
		}
	], function(err) {
		//This function gets called after the two parallel tasks have called their "task callbacks"
		if (err) return console.error(err);

		// Preprocess twitterMedias entries
		for (var i = 0; i<twitterMedias.length; i++) {
			// Replace the string created_at by a date object containing the same info
			twitterMedias[i].created_at = new Date(Date.parse(twitterMedias[i].created_at));
			twitterMedias[i].mediaType = "Twitter";
		}

		// Preprocess instagramMedias entries
		for (var j = 0; j<instagramMedias.length; j++) {
			// Replace the string created_at by a date object containing the same info
			instagramMedias[j].created_at = new Date(instagramMedias[j].created_time*1000);
			instagramMedias[j].mediaType = "Instagram";
		}

		//Copy all the medias into twitterMedias (to avoid creating a new array)
		twitterMedias.push.apply(twitterMedias,instagramMedias);
		twitterMedias.sort(function(a,b) {
			dateA = a.created_at;
			dateB = b.created_at;

			if (dateA < dateB) {
				return 1;
			}
			if (dateA > dateB) {
				return -1;
			}
			return 0;
		});

		res.send(twitterMedias);
	});
});


/* GET instagram place id */
router.get('/media/instagram', function(req, res, next) {
	var oauth = {
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6',
		client_secret: '8f83ed86028a498185a05bb4277fe601'
	};

	var url = 'https://api.instagram.com/v1/locations/search';

	var requestParams = {
		lat: req.query.loc.split(',')[0],
		lng: req.query.loc.split(',')[1],
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6'
	};

	var requestUrl = createCompleteUrl(url, requestParams);
	console.log('MEDIA/INSTAGRAM requestUrl: ' + requestUrl);

	request.get({url:requestUrl, oauth:oauth, json:true}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body);
		}
		if (error) {
			console.error('Error: ' + error);
			console.log('Status code: ' + response.statusCode);
			res.sendStatus(response.statusCode);
		}
	});
});

/* GET instagram media for lat/lng */
router.get('/media/instagram2', function(req, res, next) {
	var oauth = {
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6',
		client_secret: '8f83ed86028a498185a05bb4277fe601'
	};

	var url = 'https://api.instagram.com/locations/';
});

/* GET twitter data */
router.get('/media/twitter', function(req, res, next) {

	var oauth = {
		consumer_key: '7IYF9oKnPLDEta86RqtyehHVG',
		consumer_secret: 'a7WnvHk0fOlRSEuvGVgcIvO9gsiYgRNZWb0wrQgkL9RQAUaKpz',
		token: '3059932155-cle3iD7vkXjnd7bHHTPBMQrgVDv7YoFIxR2xx3t',
		token_secret: 'TkdySo3XL17tIi1jBcYwpOhsLPMgiyBE5BAjXUtu3xfQd'
	};

	var url = 'https://api.twitter.com/1.1/search/tweets.json';
	var requestParams = {
		q: req.query.q,
		geocode: req.query.loc+ ',1km'
	};

	var requestUrl = createCompleteUrl(url, requestParams);
	console.log('MEDIA/TWITTER requestUrl: ' + requestUrl);

	request.get({url:requestUrl, oauth:oauth, json:true},function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body.statuses);
		}
		if (error) {
			console.error('Error: ' + error);
			console.log('Status Code: ' + response.statusCode);
			res.sendStatus(response.statusCode);
		}
	});
});

/* GET foursquare request. */
router.get('/places/foursquare', function(req, res, next) {
	var url = 'https://api.foursquare.com/v2/venues/explore';

	var requestParams = {
		client_id: 'O0YY1XKVUHFMJY1B1Q04NHXMBAYLRS4IJRVLDWKYIKXER4AH',
		client_secret: 'I3YZ5Y3UK20ZIDD5GMCBDR0ZMFJH0KWB5NRS1N03TMWAYAJW&v=20130815',
		ll: req.query.loc, // example: '49.0,6.10'
		radius: req.query.radius, //example '1000'
		section: req.query.section,  //example 'food'
		limit: 20
	};

	var requestUrl = createCompleteUrl(url,requestParams);
	console.log('RequestUrl: ' + requestUrl);

	request(requestUrl,function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body);
		}
		if (error) {
			console.error('Error: ' + error);
			console.log('Status Code: ' + response.statusCode);
			res.sendStatus(response.statusCode);
		}
	});

});

module.exports = router;
