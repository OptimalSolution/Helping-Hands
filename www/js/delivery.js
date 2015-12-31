// The Pin Object
var Delivery = Parse.Object.extend("Delivery", {}, {
    create: function(pin, user, status, message) {

        var coords = pin.get('coords');
        var newDelivery = new Delivery();
        var coords = pin.get('coords');
        console.log('Creating %s delivery at %s (for %s) via %s', status, JSON.stringify(coords), pin.id, user.get('username'));
        newDelivery.set('pin', pin);
        newDelivery.set('coords', coords);
        newDelivery.set('helpedBy', user.get('username'));
        newDelivery.set('finishedBy', user);
        newDelivery.set('status', status);
        newDelivery.set('message', message);

        return newDelivery;
    }
});

var Deliveries = {

    loadNear: function(latlng, callback) {
        console.log('>> Loading deliveries.');
        var deliveryQuery = new Parse.Query(Delivery);
        deliveryQuery.equalTo('status', 'completed');
        deliveryQuery.include('pin');
        deliveryQuery.include('pin.createdBy');
        deliveryQuery.include('finishedBy');
        //deliveryQuery.near('coords', new Parse.GeoPoint(latlng.lat, latlng.lng));
        deliveryQuery.find({
          success: function(results) {
            log("Successfully retrieved " + results.length + " deliveries.");
            var deliveries = [];
            if(results.length > 0) {
                results.forEach(function(item) {

                     var timeAgo = jQuery.timeago(item.createdAt);
                     var timeElapsed = timeAgo.charAt(0).toUpperCase() + timeAgo.slice(1);
                    deliveries.push({
                        createdAt: item.createdAt,
                        timeElapsed: timeElapsed,
                        helpedBy: item.get('finishedBy').get('username'),
                        createdByUser: item.get('pin').get('createdBy').get('username'),
                        message: item.get('message')
                    })
                })
            }
            callback(deliveries);
          },
          error: function(error) {
            log("Error: " + error.code + " " + error.message);
            callback([]);
          }
        });
    }
}
