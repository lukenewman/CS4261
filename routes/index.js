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
  var fsUrl = 'https://api.foursquare.com/v2/venues/explore?';
  var fsClientId = 'client_id=O0YY1XKVUHFMJY1B1Q04NHXMBAYLRS4IJRVLDWKYIKXER4AH';
  var fsClientSecret = '&client_secret=I3YZ5Y3UK20ZIDD5GMCBDR0ZMFJH0KWB5NRS1N03TMWAYAJW&v=20130815';
  var fsLoc = req.query.loc; // example: '&ll=49.0,6.10';
  var fsRadius = req.query.radius; //example '&radius=1000';
  var fsSection = req.query.section; //example '&section=food';
  var fsLimit = '&limit=20';

  console.log(
    'Loc: ' + fsLoc +
    '; Radius: ' + fsRadius +
    '; Section: ' + fsSection
  );
  var requestUrl = fsUrl + fsClientId + fsClientSecret;

  if (fsLoc !== undefined) {
    requestUrl += '&ll=' + fsLoc;
  } else {
    res.send({}); //TODO send Bad request error
  }

  if (fsRadius !== undefined) {
    requestUrl += '&radius=' + fsRadius;
  }
  if (fsSection !== undefined) {
    requestUrl += '&section=' + fsSection;
  }

  requestUrl += fsLimit;

  console.log('requestUrl: ' + requestUrl);

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

//https://api.foursquare.com/v2/venues/search?client_id=O0YY1XKVUHFMJY1B1Q04NHXMBAYLRS4IJRVLDWKYIKXER4AH&client_secret=I3YZ5Y3UK20ZIDD5GMCBDR0ZMFJH0KWB5NRS1N03TMWAYAJW&v=20130815&ll=49.0,6.10&query=sushi



module.exports = router;
