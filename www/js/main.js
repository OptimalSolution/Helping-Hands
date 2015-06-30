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

// Initialize Parse
Parse.initialize("ChlGfJAgxi3j31gH1RbdYCNUDqLU8Xjg2c5yZ0eJ", "rCLLSMnJySeTFohQoZsTk7rY2hpaH1NlwdpjoPp3");

(function() {
    var map = {},
        app = angular.module('HelpingHandApp', []);

    //var Pin = function(coords, time_at_location) {
    var Pin = Parse.Object.extend("Pin", {
            addNeed: function(need) {
                log('Adding need: ' + need);
                this.addUnique("needs", need);
            },

            isValid: function() {
                var these_needs = this.get('needs');
                log('Validating pin: ' + (these_needs.length > 0) ? 'Has needs' : 'No needs!');
                return (these_needs && these_needs.length > 0);
            }

        }, {

            create: function(coords, time_at_location) {

                var newPin = new Pin();
                log('Creating pin...');
                newPin.set('needs', []);
                newPin.set('time_at_location', parseInt(time_at_location) || 1); // Default to 1 hour
                newPin.set('created_on', new Date());
                newPin.set('coords', coords);

                // Calculate when they will be there until
                var there_until = new Date();
                there_until.setHours(there_until.getHours() + time_at_location);
                newPin.set('there_until', there_until);
                return newPin;
            }
    });

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
            log('>> DROP PIN');

            // Clear previous choices and reset to default
            $('.needs-button').removeClass('active');
            $('.time-button').removeClass('active');
            $('.time-button:first').addClass('active'); // Highlight 1 hour
            $('#dropPinModal').modal('show');
        };

        self.init();
    })

    app.controller('MapController', function() {

        var self = this;
        self.directionsService = new google.maps.DirectionsService(),
        self.directionsDisplay = new google.maps.DirectionsRenderer();

        self.markers = [];
        self.myLatlng = false;
        self.initialMapZoom = 16;
        self.defaultLocation = { lat: 32.842674, lng: -117.257767 }  // San Diego

        self.init = function() {
            log('Init Map...');

            // Load the pins from storage and get the user's location
            self.loadPins(function(pins) {
                self.pins = pins;
                self.getUserLocation(function(location) {
                    // After getting their location, show the map and pins
                    self.createMap(location, 'map-canvas', function(mainMap) {
                        map = mainMap;
                        self.directionsDisplay.setMap(map);
                        self.showPins(pins, map);
                    });
                })
            });
        }

        self.hidePins = function() {
            self.markers.forEach(function(marker) {
                marker.setMap(null);
            })
        }

        self.unhidePins = function() {
            self.marker.forEach(function(pin) {
                marker.setMap(map);
            })
        }

        self.centerMapOnMe = function() {
            if(!self.myLatlng) {
                log_error('No user position saved');
                alert("We couldn't find your position. Please make sure Location Services is turned on.");
            }
            else {
                log('>> Centering map on me');
                map.panTo(self.myLatlng);
            }
        }

        self.showPins = function(pins) {

            if(pins && pins.length > 0) {
                log(pins.length + ' pins to show.');
                pins.forEach(function(pin) {
                    self.dropPinOnMap(pin, map);
                })
            }
            else {
                log('No pins to show.');
            }
        }

        self.getUserLocation = function(callback) {

            log(">> Getting User Locaion...");
            navigator.geolocation.getCurrentPosition(function(position) {

                var userPosition = {};
                if(position && position.coords && position.coords.latitude) {
                    self.myLatlng = { lat: position.coords.latitude, lng: position.coords.longitude }
                }
                else {
                    alert("We couldn't find your location. Please make sure Location Services is turned on.");
                    self.myLatlng = self.defaultLocation;
                }

                // Save the position and re-center the map
                log('++ GOT User Location');
                callback(self.myLatlng);

            }, function(e) {
                log_error(e + ' - Returning default location');
                alert("We couldn't find your position. Please make sure Location Services is turned on.");
                callback(self.defaultLocation);
            });
        }

        self.loadPins = function(callback) {

            log('Loading pins...');
            var pinQuery = new Parse.Query(Pin);
            pinQuery.find({
              success: function(results) {
                log("Successfully retrieved " + results.length + " pins.");
                callback(results);
              },
              error: function(error) {
                log("Error: " + error.code + " " + error.message);
                callback([]);
              }
            });
        }

        // Get a Google LatLng object from any format of coordinates
        self.getLatLng = function(coords) {
            var points = [];
            for(var i in coords) {
                points.push(coords[i]);
            }
            return new google.maps.LatLng(points[0], points[1])
        }

        self.createMap = function(coords, elementId, callback) {

                /*
            var mapCoords = { lat: -34.397, lng: 150.644};

            mapCoords = coords;
            log('>> Creating map at: ' + JSON.stringify(mapCoords) + ' for ' + elementId);
            var mapOptions = {
              center: mapCoords,
              zoom: 8
            };
            var thisMap = new google.maps.Map(document.getElementById('map-canvas'),
                mapOptions);
*/

            var thisMap = new google.maps.Map(document.getElementById(elementId), {
                    zoom: self.initialMapZoom,
                    center: self.getLatLng(coords),
                    scrollwheel: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true
            });
            callback(thisMap);
        }

        self.savePin = function() {

            var needs = $('.needs-button.active') || [],
                time_at_location = 1;

            // If there is an active time, get the value
            var time = $('.time-button.active') || [];
            if(time && time.length && time.length > 0) {
                time_at_location = time.find('.time_at_location').val();
                console.log('Time: ' + time.find('.time_at_location').val());
            }
            else {
                console.log("No time selected!")
            }

            // Create the pin
            var thisPin = Pin.create(map.getCenter(), time_at_location);

            // Save the needs to the pin
            if(needs && needs.length && needs.length > 0) {
                $(needs).find('.need').each(function() {
                    thisPin.addNeed($(this).val());
                })
                console.log("Added " + needs.length + " needs.");
            }

            if(thisPin.isValid()) {
                // If it's a valid pin: hide the overlay, then save & show the pin
                thisPin.save(null, {
                  success: function(thisPin) {
                    // Execute any logic that should take place after the object is saved.
                    log('New pin created with objectId: ' + thisPin.id);
                    $('#dropPinModal').modal('hide');
                    self.dropPinOnMap(thisPin, map);
                  },
                  error: function(thisPin, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    alert('Failed to create new pin, with error code: ' + error.message);
                  }
                });
            }
            else {
                log('INVALID PIN: Not saving');
            }
        };

        self.inspectPin = function(pinId) {

            log('Inspecting pin...');
            var pinQuery = new Parse.Query(Pin);
            pinQuery.get(pinId, {
              success: function(thePin) {
                var needs = thePin.get('needs');
                $('#inspectPinModal .needs-button').hide();
                $('#inspectPinModal .needs-labels div').hide();
                $('#inspectPinModal input[name="pin_id"]').val(pinId);

                // Show the needs that are needed
                needs.forEach(function(need) {
                    $('.' + need + '-icon').parent().addClass('active').show();
                    $('.' + need + '-icon-label').show();
                })

                $('#inspectPinModal').modal('show');

                // Create a mini-map
                var pin_location = thePin.get('coords');


              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
            });

        };

        self.giveHand = function() {

            // Center the map and hide the modal
            self.centerMapOnMe();
            self.hidePins();
            $('.map-center').hide();
            $('#inspectPinModal').modal('hide');


            log('Giving a hand to: ' + pin_id);
            var pin_id = $('#inspectPinModal input[name="pin_id"]').val();
            var pinQuery = new Parse.Query(Pin);
            pinQuery.get(pin_id, {
              success: function(thePin) {

                // Create a mini-map
                var pin_location = thePin.get('coords');
                self.directionsService.route({
                    origin: self.myLatlng,
                    destination: self.getLatLng(pin_location),
                    travelMode: google.maps.TravelMode.WALKING

                }, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                      log('=== ROUTE ===');
                      log(response);
                      self.directionsDisplay.setDirections(response);
                    }
                });
              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
            });

        }

        self.dropPinOnMap = function(pin, whichMap) {

            // Define the marker
            var image = {
                url: 'img/map_pin.png',
                size: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0,0),
                anchor: new google.maps.Point(20, 20) // Bubble center
            };

            // Define the clickable region
            var click_region = {
              coords: [1, 1, 1, 40, 40, 40, 40 , 1],
              type: 'poly'
            };

            // Drop an actual pin
            var pinLatLng = pin.get('coords'),
                marker = new google.maps.Marker({
                    position: { lat: pinLatLng.A, lng: pinLatLng.F },
                    map: whichMap,
                    icon: image,
                    shape: click_region,
                    animation: google.maps.Animation.DROP,
                    title: 'Active Pin (' + pin.id + ')',
                    pinId: pin.id,
                    zIndex: 3000
                });

                self.markers.push(marker);

                google.maps.event.addListener(marker, 'click', function() {
                    console.log('Clicked on Marker: ' + marker.pinId);
                    whichMap.setZoom(self.initialMapZoom);
                    //map.setCenter(marker.getPosition());
                    self.inspectPin(marker.pinId);
                });
        };

        // When the map API is loaded, create the map
        google.maps.event.addDomListener(window, 'load', self.init);
    });
})();
