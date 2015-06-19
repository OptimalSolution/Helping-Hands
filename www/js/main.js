//var logger = (forge && forge.logging) ? forge.logging : { info: console.log, error: console.log };
var logger = { info: console.log, error: function(text) { console.log('ERROR: ' + text) } };
function log(message) {
    console.log(message);
}

function log_error(message) {
    console.log('ERROR: ' + message);
}

function success() { log('Success!'); }
function error(content) { log_error(content); }

(function() {
    var map         = {},
        myLatlng    = false,
        pins        = [],
        storage     = window.localStorage;
        app         = angular.module('HelpingHandApp', []);

    var Pin = function(coords, time_at_location) {
        var self                = this;
        self.needs              = [];
        self.time_at_location   = time_at_location || 1; // Default to 1 hour
        self.created_on         = new Date();
        self.there_until        = new Date();
        self.coords             = coords;

        // Add the amount of time they're gonna be there to make an expiration time
        self.there_until.setHours(self.there_until.getHours() + self.time_at_location);

        self.addNeed = function(need) {
            self.needs.push(need);
        }
    };

    //storage.clear(); // DEBUG: Clear pins
    app.controller('AppController', function() {
        var self = this;

        self.init = function() {

            log('Init App...');
            // DEBUG
            //self.dropPin();
        }

        self.giveAHand = function() {
            log('++ GIVE A HAND');
        };

        // Show the drop pin modal
        self.dropPin = function() {
            log('++ DROP PIN: ' + map.getCenter());
            $('#dropPinModal').modal('show');
        };

        self.init();
    })

    app.controller('MapController', function() {

        var self = this;

        self.defaultLocation = { latitude: 32.842674, longitude: -117.257767 }  // San Diego

        self.centerMap = function(coords) {
            log('Centering map:')
            log(coords)

            var thisLatLng = new google.maps.LatLng(coords.latitude, coords.longitude);
            map.panTo(thisLatLng);
        }

        self.centerMapOnMe = function() {
            if(!myLatlng) {
                log_error('No user position saved');
                alert("We couldn't find your position. Please make sure Location Services is turned on.");
            }
            else {
                log('>> Centering map on me');
                map.panTo(myLatlng);
            }
        }

        self.showPins = function() {

            if(pins && pins.length > 0) {
                log(pins.length + ' pins to show.');
                pins.forEach(function(pin) {
                    self.dropPinOnMap(pin);
                })
            }
            else {
                log('No pins to show.');
            }
        }

        self.getUserLocation = function(callback) {

            log(">> Getting User Locaion...");
            navigator.geolocation.getCurrentPosition(function(position) {

                // Save the position and re-center the map
                myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                log('++ GOT User Location');
                callback(position.coords);

            }, function(e) {
                log_error(e + ' - Returning default location');
                callback(self.defaultLocation);
            });
        }

        self.loadPins = function(callback) {
            log('Loading pins...');
            pins = JSON.parse(storage.getItem('Pins')) || [];
            log(pins);
            callback();
        }

        self.init = function() {
            log('Init Map...');
            // Load the pins from storage and get the user's location
            self.loadPins(function() {
                self.getUserLocation(function(location) {
                    // After getting their location, show the map and pins
                    self.createMap(location, self.showPins);
                })
            });
        }

        self.createMap = function(coords, callback) {

            log('>> Creating map:')
            var thisLatLng = new google.maps.LatLng(coords.latitude, coords.longitude);

            map = new google.maps.Map(document.getElementById('map-canvas'), {
              zoom: 16,
              center: thisLatLng,
              scrollwheel: false,
              disableDefaultUI: true
            });

            callback();
        }

        self.savePin = function() {

            log('++ SAVE PIN: ' + map.getCenter());

            // Hide overlay
            $('#dropPinModal').modal('hide');

            // Extract Pin Info
            var thisPin = new Pin(map.getCenter(), 1);
            thisPin.addNeed('food');

            // Save Pin
            pins.push(thisPin);
            storage.setItem('Pins', JSON.stringify(pins));

            // Show New Pin
            self.dropPinOnMap(thisPin);
        };

        self.dropPinOnMap = function(pin) {

            // Define the marker
            var image = {
                url: 'img/map_pin.png',
                size: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0,0),
                anchor: new google.maps.Point(20, 20) // Bubble center
            };

            // Define the clickable region
            var click_region = {
              coords: [1, 1, 1, 20, 18, 20, 18 , 1],
              type: 'poly'
            };

            // Drop an actual pin
            //var pinLatLng = new google.maps.LatLng(pin.coords.latitude, pin.coords.longitude);
            var pinLatLng = pin.coords;
            log('Pin dropping: ');
            log(pin.coords);

            var marker = new google.maps.Marker({
                position: { lat: pin.coords.A, lng: pin.coords.F },
                map: map,
                icon: image,
                shape: click_region,
                animation: google.maps.Animation.DROP,
                title: 'Active Pin',
            });


        };

        // When the map API is loaded, create the map
        google.maps.event.addDomListener(window, 'load', self.init);
    });
})();
