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

        self.dropPin = function() {

            log('++ DROP PIN: ' + map.getCenter());

            // Show overlay
            $('#dropPinModal').modal('show');


            // Save pin info
        };

        self.savePin = function() {

            log('++ SAVE PIN: ' + map.getCenter());

            // Show overlay
            $('#dropPinModal').modal('hide');
            var thisPin = new Pin(map.getCenter(), 1);
            thisPin.addNeed('food');
            pins.push(thisPin);

            log('Saving PIN:');
            log(pins);
            storage.setItem('Pins', JSON.stringify(pins));
            // Save pin info
        };

        self.dropPinOnMap = function() {
            // Drop an actual pin

            log('Pin dropped')
            /*
            var marker = new google.maps.Marker({
                position: currentPosition,
                animation: 'BOUNCE',
                map: map,
                shape: { type: 'circle', coords: [myLatlng.latitude, myLatlng.longitude, 3]},
                title: 'My Position'
            });*/
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

        // When the map API is loaded, create the map
        google.maps.event.addDomListener(window, 'load', self.init);
    });
})();
