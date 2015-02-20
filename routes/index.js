var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


function isEmpty(object) {
  for(var i in object) {
    return true;
  }
  return false;
}

/* GET /places request. */
router.get('/places', function(req, res, next) {
  var fsUrl = 'https://api.foursquare.com/v2/venues/explore';

  var requestParams = {
    client_id: 'O0YY1XKVUHFMJY1B1Q04NHXMBAYLRS4IJRVLDWKYIKXER4AH',
    client_secret: 'I3YZ5Y3UK20ZIDD5GMCBDR0ZMFJH0KWB5NRS1N03TMWAYAJW&v=20130815',
    ll: req.query.loc, // example: '49.0,6.10'
    radius: req.query.radius, //example '1000'
    section: req.query.section,  //example 'food'
    limit: 20
  };

  var requestUrl = fsUrl;

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

  console.log('RequestUrl: ' + requestUrl);

  request(requestUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //console.log(body);
      res.send(body);
    }

    if (error) {
      console.log('Error: ' + error);
      console.log('Status Code: ' + response.statusCode);
      res.send(response.statusCode);
    }
  });

});


module.exports = router;
