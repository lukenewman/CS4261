var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');
var mongojs = require('mongojs');

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('happnin', { title: 'Express' });
});

var db = mongojs('mongolab_user:CS4261_user@ds031561.mongolab.com:31561/heroku_app33937405');
var featured = db.collection('featured');
var userRating = db.collection('user_rating');

if (db !== undefined) {
	console.log("db connection OK");
}

if (featured !== undefined) {
	console.log("featured collection OK");
}

if (userRating !== undefined) {
	console.log("user_rating collection OK");
}

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
	var yelpPlaces = [];
	var dbPlaces = [];

	var radius;

	if (req.query.radius !== undefined) {
		radius = req.query.radius;
	} else {
		radius = 2000;
	}

	var section;
	if (req.query.section !== undefined) {
		section = req.query.section;
	} else {
		section = "";
	}

	async.parallel([
		/*Request to Yelp API*/
		function(callback){
			var oauth = {
				consumer_key: 'ITZtXcKc38ITLI_nLh8ogg',
				consumer_secret: 'V2UPsiirFcVE0EziN8D7k3894qo',
				token: 'B_BSlUYZ7em3w9d7FBZqZHmzfciE8qpD',
				token_secret: '1imyzTp9XdNRnLtLsZXSLXH552M'
			};
			var url = 'http://api.yelp.com/v2/search';
			var requestParams = {
				ll: req.query.loc, // example: '49.0,6.10'
				radius_filter: radius, //example '1000'
				category_filter: req.query.section, // example 'restaurants'
				// complete list: http://www.yelp.com/
				// developers/documentation/v2/all_category_list
				sort: 2, // sort the business by Highest Rated
				//limit: 20 //total number of business
			};

			var requestUrl = createCompleteUrl(url, requestParams);
			console.log('PLACES/ requestUrl: ' + requestUrl);

			request.get({url:requestUrl, oauth:oauth, json:true},function (error, response, body) {
				if (!error && response.statusCode == 200) {
					yelpPlaces = body.businesses;
				}
				if (error) {
					console.error('Error: ' + error);
					console.log('Status Code: ' + response.statusCode);
					res.sendStatus(response.statusCode);
				}
				callback();
			});
		},

		/*Call to MongoDB to get the list of close rated/featured places*/
		function(callback){

			featured.find({
				loc: {
					$near: {
						$geometry: {
							type: "Point" ,
							coordinates: [ Number(req.query.loc.split(',')[1]), Number(req.query.loc.split(',')[0])]
						},
						$maxDistance: Number(radius + 500)
					}
				}
			}, function(err,docs) {
				if (err !== null) {
					console.log(err);
				} else {
					dbPlaces = docs;
				}

				callback();
			});
		}
	],
	function(err) {
		console.log("dbPlaces length: " + dbPlaces.length);

		var places = {
			category: section,
			businesses: []
		};

		if (yelpPlaces === undefined) {
			yelpPlaces = [];
		}

		for (var j = 0; j < yelpPlaces.length; j++) {
			places.businesses[j] = {};
			places.businesses[j].id = yelpPlaces[j].id;
			places.businesses[j].name = yelpPlaces[j].name;
			places.businesses[j].latitude = yelpPlaces[j].location.coordinate.latitude;
			places.businesses[j].longitude = yelpPlaces[j].location.coordinate.longitude;
			places.businesses[j].phoneNumber = (yelpPlaces[j].phone !== undefined)?yelpPlaces[j].phone:"";
			places.businesses[j].imageURL = (yelpPlaces[j].image_url !== undefined)?yelpPlaces[j].image_url:"";
			places.businesses[j].isClosed = yelpPlaces[j].is_closed;
			places.businesses[j].distance = yelpPlaces[j].distance;
			places.businesses[j].rating = yelpPlaces[j].rating;
			places.businesses[j].address = yelpPlaces[j].location.display_address;

			if (dbPlaces.length !== 0) {
				for (var i = 0; i < dbPlaces.length; i++) {
					if (dbPlaces[i]._id == yelpPlaces[j].id) {
						places.businesses[j].featuredValue = dbPlaces[i].investment;
						voteNb = dbPlaces[i].vote_nb;
						voteMean = dbPlaces[i].vote_mean;
						places.businesses[j].rating = (10*places.businesses[j].rating + voteNb*voteMean)/(10 + voteNb);

					} else {
						places.businesses[j].featuredValue = 0;
					}
				}
			} else {
				places.businesses[j].featuredValue = 0;
			}
		}

		res.send(places);
	});

});

/*GET medias*/
router.get('/medias', function(req, res, next) {

	var twitterMedias = [];
	var instagramId;
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
			console.log("Started Twitter media task");
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
					console.log("Started Instagram ID task");
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
							if (body.data.length !== 0) {
								instagramId = body.data[0].id;
							}
						} else {
							console.error('Error: ' + error);
							console.log('Status code: ' + response.statusCode);
						}
						callback();
					});
				},
				//Get the instagram posts of the place
				function(callback) {
					console.log("Started Instagram media task");
					console.log("instagramId is " + instagramId);
					var url;
					if (instagramId !== undefined) {
						url = 'https://api.instagram.com/v1/locations/' + instagramId + '/media/recent';
					} else {
						callback();
						return;
					}
					var requestParams = {
						client_id: 'c40df6cf23aa448c9c2da9007284f8e6'
					};

					var requestUrl = createCompleteUrl(url, requestParams);
					console.log('MEDIA/INSTAGRAM requestUrl: ' + requestUrl);

					request.get(requestUrl, function(error, response, body) {
						if (!error && response.statusCode == 200) {
							body = JSON.parse(body);
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

		var medias = {
			data: []
		};

		// Preprocess twitterMedias entries
		for (var i = 0; i<twitterMedias.length; i++) {
			medias.data[i] = {};
			// Replace the string created_at by a date object containing the same info
			medias.data[i].createdAt = new Date(Date.parse(twitterMedias[i].created_at));
			medias.data[i].mediaType = "Twitter";
			medias.data[i].text = twitterMedias[i].text;
			medias.data[i].username = twitterMedias[i].user.screen_name;
			medias.data[i].profileImageURL = (twitterMedias[i].user.profile_image_url!==null)?twitterMedias[i].user.profile_image_url:"";
		}

		var offset = twitterMedias.length;
		// Preprocess instagramMedias entries
		for (var j = 0; j<instagramMedias.length; j++) {
			medias.data[j+offset] = {};
			// Replace the string created_at by a date object containing the same info
			medias.data[j+offset].createdAt = new Date(instagramMedias[j].created_time*1000);
			medias.data[j+offset].mediaType = "Instagram";
			medias.data[j+offset].imageURL =  instagramMedias[j].images.standard_resolution.url;
			medias.data[j+offset].username = instagramMedias[j].user.username;
			medias.data[j+offset].profileImageURL = (instagramMedias[j].user.profile_picture!==null)?instagramMedias[j].user.profile_picture:"";
			medias.data[j+offset].caption = (instagramMedias[j].caption!==null)?instagramMedias[j].caption.text:"";
			medias.data[j+offset].type = instagramMedias[j].type;
			medias.data[j+offset].width = instagramMedias[j].images.standard_resolution.width;
			medias.data[j+offset].height = instagramMedias[j].images.standard_resolution.height;
		}

		medias.data.sort(function(a,b) {
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

		// medias = {
		// 	medias: twitterMedias
		// };
		res.send(medias);
	});
});



/*POST to create/update the vote of the user
body format: {
username: "username" (String),
userId: user_id (Long),
placeId: "yelp generated Place id" (String),
rating: rating of the user (Float),
lng: longitude of the place (Float),
lat: latitude of the place (Float),
placeName: "name of the place" (String)
}

*/
router.post('/places/vote', function(req, res, next) {

	var date = new Date();
	var body = req.body;
	//var body = JSON.parse(req.body);
	console.log(body);


	var featuredPlace = {
		_id: body.placeId,
  	name: body.placeName,
  	loc: {
	      type: "Point",
	      coordinates: [
	          body.lng,
	          body.lat
	      ]
	  },
  	investment: 0,
  	vote_nb: 1,
  	vote_mean: parseFloat(body.rating)
	};

	async.parallel([

		// Create/Update the vote in the user_rating table
		function(callback){
			userRating.update({
				user_id: body.userId,
				place_id: body.placeId
			},{
				username: body.username,
				user_id: body.userId,
				place_id: body.placeId,
				rating: parseFloat(body.rating),
      	created_at: date.toString()
			},{
				upsert: true
			}, function() {
    		console.log("user_rating entry updated");
				callback();
			});
		},

		// Create/Update the vote in the user_rating table
		function(callback){
			async.series([

				//Retrieves the informations in the featured table
				function(callback){
					featured.findOne({_id: body.placeId}, function(err,doc) {
						console.log("featured db call: " + doc);

						if (doc !== null) {
							featuredPlace.name = doc.name;
							featuredPlace.loc = doc.loc;
							featuredPlace.investment = doc.investment;
							featuredPlace.vote_nb = doc.vote_nb + 1;
							featuredPlace.vote_mean = (parseFloat(doc.vote_mean)*doc.vote_nb + featuredPlace.vote_mean)/(featuredPlace.vote_nb);
						}

						callback();
					});
				},

				//Update or create the informations in the featured table
				function(callback){
					featured.update({
						_id: featuredPlace._id
					},{
						_id: featuredPlace._id,
						name: featuredPlace.name,
						loc: {type: "Point",coordinates: [parseFloat(featuredPlace.loc.coordinates[0]),parseFloat(featuredPlace.loc.coordinates[1])]},
						investment: featuredPlace.investment,
						vote_nb: featuredPlace.vote_nb,
						vote_mean: featuredPlace.vote_mean
					},{
						upsert: true
					}, function(err) {
		    		console.log("featured entry updated");
						//console.log(featuredPlace);
						console.log(err);
						callback();
					});
				}
			], callback);
		}
	], function(err){
		console.log("End of the /places/vote call");
		console.log(err);
		res.send({
			placeId: featuredPlace._id,
			name: featuredPlace.name,
			vote_nb: featuredPlace.vote_nb,
			vote_mean: featuredPlace.vote_mean
		});
	});

});












/******************************************************************************/
/*********************************____________*********************************/
/********************************| DEPRECATED |********************************/
/********************************|____________|********************************/
/*********************************            *********************************/
/******************************************************************************/


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

	request.get(requestUrl, function(error, response, body) {
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

/* GET instagram media for place id */
router.get('/media/instagram2', function(req, res, next) {
	var oauth = {
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6',
		client_secret: '8f83ed86028a498185a05bb4277fe601'
	};

	// https://api.instagram.com/v1/locations/271364243/media/recent?client_id=...
	var url = 'https://api.instagram.com/v1/locations/' + req.query.id + 'media/recent';

	var requestParams = {
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6'
	};

	var requestUrl = createCompleteUrl(url, requestParams);
	console.log('/MEDIA/INSTAGRAM2 requestUrl: ' + requestUrl);

	request.get(requestUrl, function(error, response, body) {
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

module.exports = router;
