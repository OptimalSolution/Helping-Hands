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
            },

            getMapPoints: function() {
                var myCoords = this.get('coords'),
                converted = [myCoords.latitude, myCoords.longitude];

                log('Geo point:');
                log(converted);

                return converted;

                var points = [];
                for(var i in myCoords) {
                    points.push(myCoords[i]);
                }
                return [points[0], points[1]];
            }

        }, {

            create: function(coords, time_at_location) {

                var newPin = new Pin();
                log('Creating pin at: ');
                log(coords);
                newPin.set('needs', []);
                newPin.set('time_at_location', parseInt(time_at_location) || 1); // Default to 1 hour
                newPin.set('created_on', new Date());

                var mapPoints = [], n = 0;
                for(var i in coords) {
                    if(n <= 1) {
                        mapPoints.push(coords[i]);
                    }
                    n++;
                }
                newPin.set('coords', new Parse.GeoPoint(mapPoints[0], mapPoints[1]));

                // Calculate when they will be there until
                var there_until = new Date();
                there_until.setHours(there_until.getHours() + time_at_location);
                newPin.set('there_until', there_until);
                return newPin;
            }
    });

    app.controller('AppController', function() {
        var self = this;
        self.greeting = 'Welcome...';

        self.init = function() {

            log('Init App...');
            // Check to see if they're logged in already

        }

        self.showUserFeed = function() {

            log('Showing user feed...');
            // Check to see if they're logged in already

        }

        self.showUserInfo = function() {

            log('Showing User Info...');
            // Check to see if they're logged in already

        }

        self.login = function() {
            $('.loading-screen').fadeOut('medium');
        }

        self.logout = function() {
            if(confirm("Would you like to log out?")) {
                return true;
            }
            else {
                return false;
            }
        }

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
        self.directionsService = null,
        self.directionsDisplay = null;

        self.markers = [];
        self.myLatlng = false;
        self.initialMapZoom = 16;
        self.defaultLocation = { lat: 32.842674, lng: -117.257767 }  // San Diego

        self.init = function() {
            log('Init Map...');

            self.directionsDisplay = new google.maps.DirectionsRenderer();

            // Load the pins from storage and get the user's location
            self.getUserLocation(function(location) {
                log('*** User location ***');
                log(location);
                // After getting their location, load pins nearby
                self.loadPins(function(pins) {
                    self.pins = pins;
                    self.createMap(location, 'map-canvas', function(mainMap) {
                        map = mainMap;
                        self.directionsDisplay.setMap(map);
                        self.showPins(pins, map);
                    });
                })
            });
        }

        self.inspectNearestPin = function() {
            log('Finding nearest pin...');
            self.loadPins(function(pins) {
                if(pins && pins.length > 0) {
                    self.inspectPin(pins[0].id);
                }
                else {
                    alert("Sorry, but we can't find anyone in need that is also within walking distance of your current location.");
                }
            })
        };

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
                log(self.myLatlng);
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

            log('Loading pins around ' + self.myLatlng.lat + ',' + self.myLatlng.lng);
            var pinQuery = new Parse.Query(Pin);
            pinQuery.near('coords', new Parse.GeoPoint(self.myLatlng.lat, self.myLatlng.lng));
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

            var thisMap = new google.maps.Map(document.getElementById(elementId), {
                    zoom: self.initialMapZoom,
                    center: self.getLatLng(coords),
                    scrollwheel: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true,
                    disableDoubleClickZoom: true
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

                // Show approximate distance and time
                self.getDirectionsToPin(thePin, function(err, directions) {

                    var stats = self.getRouteStats(directions);
                    $('#inspectPinModal .location-details .distance').text(stats.distance);
                    $('#inspectPinModal .location-details .time').text(stats.time);
                    $('#inspectPinModal .location-details .eta').text(stats.eta);
                    $('#inspectPinModal').modal('show');
                })
              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
            });

        };
        self.getRouteStats = function(directions) {
            var stats = { distance: 0.0, time: 0.0, eta: '(Unknown)' };
            var now = new Date();

            // If there is a route, sum up the distance of the legs
            if(directions.routes && directions.routes[0]) {
                var route = directions.routes[0];
                if(route && route.legs && route.legs[0]) {
                    stats.distance = route.legs[0].distance.text;
                    stats.time = route.legs[0].duration.text;
                    var eta = new Date(now.getTime() + 1000*route.legs[0].duration.value);
                    stats.eta = eta.getHours() + ':' + eta.getMinutes();
                    stats.eta = eta.toLocaleTimeString();
                }
            }
            return stats;
        }
        self.giveHand = function() {

            // Center the map and hide the modal
            self.centerMapOnMe();
            self.hidePins();
            $('.map-center').hide();
            $('#inspectPinModal').modal('hide');

            var pin_id = $('#inspectPinModal input[name="pin_id"]').val();
            var pinQuery = new Parse.Query(Pin);
            pinQuery.get(pin_id, {
              success: function(thePin) {

                log('Giving a hand to: ' + pin_id);
                self.getDirectionsToPin(thePin, function(err, directions) {
                    if (!err) {
                      log('=== DISPLAYING ROUTE ===');
                      self.directionsDisplay.setDirections(directions);
                    }
                });
              },
              error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a Parse.Error with an error code and message.
              }
            });

        }

        self.getDirectionsToPin = function(thePin, callback) {

            // Init directions service
            if(!self.directionsService) {
                self.directionsService = new google.maps.DirectionsService();
            }
            // TODO: Cache this!
            log('Getting directions to a pin...');

            // Create a mini-map
            var pin_location = thePin.get('coords');
            self.directionsService.route({
                origin: self.myLatlng,
                destination: self.getLatLng(pin_location),
                travelMode: google.maps.TravelMode.WALKING

            }, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    callback(null, response);
                }
                else {
                    callback(status, response);
                }
            });
        };

        self.cancelDelivery = function(pin, whichMap) {
            // Ask them why on their way out (can't find person, ran out of time)
        };

        self.completeDelivery = function(pin, whichMap) {
            // 1) Ask them if they delivered the goods
        };

        self.markDeliveryComplete = function(pin, whichMap) {
            // 1) Mark the delivery as complete
            // 2) Update the HH feed
            // 3) Notify the creator that this person helped
        };

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
            var pinLatLng = pin.getMapPoints(),
                marker = new google.maps.Marker({
                    position: { lat: pinLatLng[0], lng: pinLatLng[1] },
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
        //log("***** MAP INIT OFF *****")
        google.maps.event.addDomListener(window, 'load', self.init);
    });
})();
