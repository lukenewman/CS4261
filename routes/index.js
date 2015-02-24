var express = require('express');
var router = express.Router();
var request = require('request');

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
	console.log('RequestUrl: ' + requestUrl);

	request.get({url:requestUrl, oauth:oauth, json:true},function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body);
		}
		if (error) {
			console.log('Error: ' + error);
			console.log('Status Code: ' + response.statusCode);
			res.send(response.statusCode);
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
			console.log('Error: ' + error);
			console.log('Status Code: ' + response.statusCode);
			res.send(response.statusCode);
		}
	});
});

/* GET instagram place id */
router.get('/places/instagram', function(req, res, next) {
	var oauth = {
		client_id: 'c40df6cf23aa448c9c2da9007284f8e6',
		client_secret: '8f83ed86028a498185a05bb4277fe601'
	}
	
	var url = 'https://api.instagram.com/v1/locations/search'
	
	var requestParams = {
		lat: req.query.loc.split(',')[0],
		lng: req.query.loc.split(',')[1]
	}
	
	var requestUrl = createCompleteUrl(url, requestParams)
	console.log('PLACES/INSTAGRAM requestUrl: ' + requestUrl)
	
	request.get({url:requestUrl, oauth:oauth, json:true}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			res.send(body)
		}
		if (error) {
			console.error()
			console.log('Error: ' + error)
			console.log('Status code: ' + response.statusCode)
			res.send(response.statusCode)
		}
	})
});


module.exports = router;
