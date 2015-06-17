//var logger = (forge && forge.logging) ? forge.logging : { info: console.log, error: console.log };
var logger = { info: console.log, error: function(text) { console.log('ERROR: ' + text) } };
function log(message) {
    console.log(message);
}

function success() { log('Success!'); }
function error(content) { logger.error(content); }

(function() {
    var map = {},
        myLatlng = false,
        pins = [],
        app = angular.module('HelpingHandApp', []);

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

            log('++ DROP PIN: Showing modal');

            // Show overlay
            $('#dropPinModal').modal('show');


            // Save pin info
        };

        self.dropPinOnMap = function() {
            // Drop an actual pin

            logger('Pin dropped')
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
                logger.error('No user position saved');
                alert("We couldn't find your position. Please make sure Location Services is turned on.");
            }
            else {
                log('>> Centering map on me');
                log(myLatlng);
                map.panTo(myLatlng);
            }
        }

        self.getUserLocation = function() {

            log(">> Getting User Locaion...")
            // TODO: Make it so that it falls back to HTML5 location (or HTML5 lookup on timeout)
            forge.geolocation.getCurrentPosition(function(position) {

                // Save the position and re-center the map
                myLatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                log('++ Saving User Position')
                log(myLatlng)
                forge.prefs.set("myLastLocation", position.coords)
                self.centerMapOnMe();
            }, logger.error, { "enableHighAccuracy": true });
        }

        self.getLastUserLocation = function(callback) {
            log("Looking up last location")
            callback(self.defaultLocation)
            /*forge.prefs.get("myLastLocation", function(location) {
                if (location) { // user has previously selected a city
                    log('++ Cached user location ' + (typeof location))
                    callback(location)
                } else { // no previous selection
                    log('-- Default user location!')
                    callback(self.defaultLocation)
                }
            }, function (error) {
                forge.logging.error("Failed when retrieving last location");
                callback(self.defaultLocation)
            });*/
        }

        self.init = function() {
            //self.getUserLocation();
            log('Init Map...');
            self.getLastUserLocation(function(location) {
                self.createMap(location);
            })
        }

        self.createMap = function(coords) {

            log('>> Creating map:')
            var thisLatLng = new google.maps.LatLng(coords.latitude, coords.longitude);

            map = new google.maps.Map(document.getElementById('map-canvas'), {
              zoom: 16,
              center: thisLatLng,
              scrollwheel: false,
              disableDefaultUI: true
            });
        }

        self.init();
    });
})();
