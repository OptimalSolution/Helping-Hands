// The Pin Object
var Delivery = Parse.Object.extend("Delivery", {}, {
    create: function(pin, user, status, message) {

        var newDelivery = new Delivery();
        log('Creating %s delivery (%s) for %s', status, pin.id, user.id);
        newDelivery.set('pin', pin);
        newDelivery.set('user', user);
        newDelivery.set('status', status);
        newDelivery.set('message', message);
        return newDelivery;
    }
});
