# CS4261 Server

## Location data

### API calls

The current endpoint is:

	https://agile-tor-1071.herokuapp.com

To get data back, you need to go to '/places' and add a few parameters:

- loc (**REQUIRED**): location you look for, in the format 'longitude,latitude', for example loc=49.0,6.10
- radius (Optional): The radius of the search
- section (Optional): The kind of content you're looking for. **Warning:** the possible values are not the same using foursquare and [yelp]

For now, we only retrieve the 20 best results, but that could be easily added to the parameters

[yelp]: http://www.yelp.com/developers/documentation/v2/all_category_list


For example, you can try in your browser:

	https://agile-tor-1071.herokuapp.com/places?loc=49.0,6.10&section=restaurants

Don't forget the ? before the first parameter and the & between each parameter

### Yelp or foursquare ?

For all I have seen, the results are much better using Yelp (more business) in Metz. That is probably not true everywhere in the world, depending on the popularity of each service. For now, the default is to use Yelp. If you want to test the results of foursquare you can find them at '/places/foursquare'


## Media Contents

### Twitter

Twitter requests can be tested on the following endpoint: '/media/twitter'
It requires two parameters:

- q : the query, a string you want to find in the tweets, for example, the name of the place
- loc (**REQUIRED**): location you look for, in the format 'longitude,latitude', for example loc=49.0,6.10

### Instagram

...

### Mixed response

You can place a request on the endpoint '/medias' and it will respond with a JSONArray filled with both tweets and instagram posts, ordered by date (the most recent will be at the beginning of the list).

It requires two parameters:

- q : the query, a string you want to find in the tweets, for example, the name of the place
- loc (**REQUIRED**): location you look for, in the format 'longitude,latitude', for example loc=49.0,6.10

For example, you can try on your browser:

	https://agile-tor-1071.herokuapp.com/medias?q=&loc=49.0,6.10
