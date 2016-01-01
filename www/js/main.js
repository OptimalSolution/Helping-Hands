(function() {
    var map = {},
        currentPin = null,
        deliveryUnderway = false,
        myLatlng = {},
        app = angular.module('HelpingHandApp', []);


    app.controller('AppController', ['$scope', '$log', function($scope, $log) {
        var self = this;
        $scope.$log = $log;
        self.greeting = 'Welcome...';
        self.deliveries = [];

        self.init = function() {

            log('Init App...');

            // Check to see if they're logged in already
            self.user = Parse.User.current();
            thisUser = self.user;
            console.log('SELF.USER')
            console.log(JSON.stringify(self.user))
            if (self.user) {
                log('Already logged in as: ' + self.user.get('username'));
                self.startApp();
            }
            else {
                $('.connect-buttons').show();
                $('.login-prompt').hide()
                                  .find('#email').parent().hide();
                $('.login-screen').fadeIn('fast');
            }

            // Have Complete/Cancel always show up if a delivery in underway and there are no dialogs
            $('#cancelDeliveryModal, #completeDeliveryModal').on('hidden.bs.modal', function (e) {
                if(deliveryUnderway) {
                    self.showCancelCompleteOptions();
                }
            })
        }

        self.startApp = function() {
            self.getRecentDeliveries();
            $('.login-screen').fadeOut('medium');
        }

        self.getRecentDeliveries = function() {

            console.log(">> Getting recent deliveries...")
            // Fetch the most recent deliveries
            Deliveries.loadNear(myLatlng, function (nearbyDeliveries) {
                self.deliveries = nearbyDeliveries || {};
                //console.log('++++++ ' + self.deliveries.length + ' deliveries loaded');
                //console.log(JSON.stringify(self.deliveries));
            })
        }

        self.loginWithUsername = function() {
            $('.connect-buttons').fadeOut('fast', function() {
                $('button.login').show();
                $('button.create').hide();
                $('.login-prompt .greeting').text('');
                $('.login-prompt').fadeIn('fast');
            });
        }

        self.createAccount = function() {
            var username = $('#username').val(),
                password = $('#password').val(),
                email = $('#email').val();
            log('Create account: U: ' + username + ' / P: ' + password + ' / E: ' + email);

            var user = new Parse.User();
            user.set("username", username);
            user.set("password", password);
            user.set("email", email);

            user.signUp(null, {
              success: function(user) {
                self.login();
              },
              error: function(user, error) {
                // Show the error message somewhere and let the user try again.
                log("Error: " + error.code + " " + error.message);
                self.GreetingMessage('<error>Sorry, ' + error.message + '</error>')
              }
            });
        }

        self.showCreateAccountScreen = function() {
            self.GreetingMessage('<strong class="txt-warn">Please fill in your details to create an account.</stron>');
            $('#email').show().parent().show();
            $('.create-account, button.login').hide();
            $('button.create').show();
            $('.connect-buttons').fadeOut('fast', function() {
                $('.login-prompt').fadeIn('fast');
            });

        }

        self.showHelpstream = function() {

            $('.btn-helpstream, .btn-userinfo').hide();
            $('.btn-close, .btn-back').show().bind('click', self.hideHelpstream);
            $('#helpstream').fadeIn('fast');
        }

        self.hideHelpstream = function() {
            $('.btn-helpstream, .btn-userinfo').show();
            $('.btn-close, .btn-back').hide().unbind();
            $('#helpstream').fadeOut('fast');
        }

        self.showCancelCompleteOptions = function() { $('.cancel-complete').fadeIn('fast'); }
        self.hideCancelCompleteOptions = function() { $('.cancel-complete').fadeOut('fast'); }
        self.showUserInfo = function() {
            log('Showing User Info...');
            // Check to see if they're logged in already
        }

        self.GreetingMessage = function(msg) {
            $('.login-prompt .greeting').html(msg);
        }

        self.login = function() {
            var username = $('#username').val(),
                password = $('#password').val();

            log('Logging in: ' + username + ' / ' + password);
            $('button.login').text('Logging in...');
            Parse.User.logIn(username, password, {
                success: function(user) {

                    self.startApp();
                    log('Successful login!')
                    $('button.login').text('Login');
                },
                error: function(user, error) {
                    // The login failed. Check error to see why.
                    log('FAILED login: ');
                    log(error);
                    self.GreetingMessage('<error>Invalid login. Please try again.</error>');
                    $('button.login').text('Login');
                }
            });
        }

        self.logout = function() {
            if(confirm("Would you like to log out?")) {
                Parse.User.logOut();
                self.init();
            }
        }

        // Show the drop pin modal
        self.dropPin = function() {
            log('>> DROP PIN');
            log(map.getCenter());

            // Clear previous choices and reset to default
            $('.needs-button').removeClass('active');
            $('.time-button').removeClass('active');
            $('.time-button:first').addClass('active'); // Highlight 1 hour
            $('#dropPinModal').modal('show');
        };


        self.cancelRoute = function() {
            self.hideCancelCompleteOptions();
            $('#cancelDeliveryModal').modal('show');
        }

        self.cancelDelivery = function() {
            // Ask them why on their way out (can't find person, ran out of time)
            log('Cancelling delivery...');
            var reason_selected = $('.reasons label.active');
            if(reason_selected && reason_selected.text().trim() !== '') {
                var reason = reason_selected.text().trim();

                // TODO: Save cancellation reason to DB
                var cancelledDelivery = Delivery.create(currentPin, self.user, 'cancelled', reason);
                cancelledDelivery.save(null, {
                  success: function(thisPin) {
                    deliveryUnderway = false;
                    log('Delivery marked as cancelled: ' + currentPin.id);
                    $log.debug('Delivery cancelled: ' + reason);
                  },
                  error: function(thisPin, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    alert('Failed to mark pin as completed: ' + error.message);
                  }
                });

                self.resetMap();
            }
            else {
                alert("Please choose a reason.");
                log(reason_selected);
            }
        };

        self.completeRoute = function() {
            self.hideCancelCompleteOptions();
            $('#completeDeliveryModal').modal('show');
        }

        self.completeDelivery = function() {
            // Ask them why on their way out (can't find person, ran out of time)
            log('Completing delivery...');
            var helpers_note = $('.helpers-note').val().trim();

            if(helpers_note !== '') {

                // TODO: Save cancellation reason to DB
                var completedDelivery = Delivery.create(currentPin, self.user, 'completed', helpers_note);
                completedDelivery.save(null, {
                  success: function(thisPin) {

                    log('Delivery marked as completed: ' + currentPin.id);
                    // Mark pin as completed by this user

                    // Reset everything
                    $log.debug('Delivery note: ' + helpers_note);
                    deliveryUnderway = false;
                    self.hideCancelCompleteOptions(); // Just in case of lag
                    self.markDeliveryComplete(helpers_note);
                  },
                  error: function(thisPin, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    alert('Failed to mark pin as completed: ' + error.message);
                  }
                });


            }
            else {
                alert("Please tell us what you delivered.");
                log('No helper note given. Not submitting.');
            }
        };

        self.resetMap = function() {
            log("Broadcast Event: resetMap");
            $('#completeDeliveryModal, #cancelDeliveryModal').modal('hide');
            $scope.$broadcast('resetMap', {});
        }

        self.markDeliveryComplete = function(deliveryNote) {

            log('Marking pin as complete: ' + currentPin.id);

            // 1) Mark the delivery as complete
            currentPin.set('completed', true);

            currentPin.save(null, {
              success: function(thisPin) {

                log('Pin marked complete: ' + thisPin.id);
                self.resetMap();
              },
              error: function(thisPin, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                alert('Failed to mark pin as completed: ' + error.message);
              }
            });

            // 2) Update the HH feed
            // 3) Notify the creator that this person helped
        };

        self.init();
    }])

    app.controller('MapController', ['$scope', '$log', function($scope, $log) {

        var self = this;
        self.pins = null;
        self.pinCache = {};
        self.pinQuery = new Parse.Query(Pin);
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
                    self.createMap(location, 'map-canvas', function(mainMap) {

                        if(pins && pins[0]) {
                            console.log('****************');
                            console.log(pins[0]);
                            console.log(JSON.stringify(pins[0].get('createdBy').get('username')));
                        }

                        map = mainMap;
                        self.directionsDisplay.setMap(map);
                        $('.map-center').show();
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

                myLatlng = self.myLatlng;

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

            // Only reload the pins if they aren't cached
            if(!self.pins) {
                log('Loading pins around ' + self.myLatlng.lat + ',' + self.myLatlng.lng);
                self.pinQuery = new Parse.Query(Pin);
                self.pinQuery.near('coords', new Parse.GeoPoint(self.myLatlng.lat, self.myLatlng.lng));
                self.pinQuery.include('createdBy');
                self.pinQuery.equalTo('completed', false);
                self.pinQuery.find({
                  success: function(results) {
                    log("Successfully retrieved " + results.length + " pins.");
                    self.pins = results;
                    callback(results);
                  },
                  error: function(error) {
                    log("Error: " + error.code + " " + error.message);
                    callback([]);
                  }
                });

            }
            else {
                // The pins have already been loaded, so just return them
                callback(self.pins);
            }
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

        self.getNeighborhood = function(mapPoints, callback) {

            // Look up the neighborhood
            var api_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + mapPoints[0] + "," + mapPoints[1] + "&key=AIzaSyC6Qfbd_zjalNr0MmZa_rNMn4KsA6POwY4&result_type=neighborhood&location_type=APPROXIMATE"
            $.ajax({ url: api_url, dataType: 'json', crossDomain: true }).done(function(data) {
                console.log('****** Geolocation resutlts ****** ')
                var neighborhood = '(Unknown)';
                if(data && data.results && data.results && data.results.length > 0) {
                    var area = data.results[0];
                    if(area.address_components) {
                        for(var i in area.address_components) {
                            var part = area.address_components[i];
                            console.log('Checking: ' + JSON.stringify(part))
                            if(part.types[0] == 'neighborhood') {
                                neighborhood = part.short_name;
                                console.log('++ Neighborhood found: ' + neighborhood);
                                break;
                            }
                        }
                    }
                }
                callback(neighborhood);
            })
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
            var coords = [map.getCenter().lat(), map.getCenter().lng()];
            var thisPin = Pin.create(coords, time_at_location);
            self.getNeighborhood(coords, function(neighborhood) {
                thisPin.set('neighborhood', neighborhood);

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

            })


        };

        self.getPinById = function(pinId, callback) {
            log('Geting pin: ' + pinId);
            var pin_found = false;

            // First, search the local cache
            if(self.pins) {
                self.pins.forEach(function(pin) {
                    if(pin.id == pinId) {
                        pin_found = true;
                        callback(null, pin);
                    }
                })
            }

            // The last resort is to look it up on the server
            if(!pin_found) {
                self.pinQuery.get(pinId, {
                    success: function(thePin) {
                        self.pinCache[pinId] = thePin;
                        callback(null, thePin);
                    },
                    error: function(object, error) {
                        callback(error, thePin);
                    }
                });
            }
        }

        self.inspectPin = function(pinId) {

            log('Inspecting pin...');
            self.getPinById(pinId, function(err, thePin) {
                log('Pin found!');
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

                    $('#inspectPinModal .location-details .neighborhood').text(thePin.get('neighborhood')).css('font-weight','bold');
                    $('#inspectPinModal .location-details .distance').text(stats.distance).css('font-weight','bold');
                    $('#inspectPinModal .location-details .time').text(stats.time).css('font-weight','bold');
                    $('#inspectPinModal .location-details .eta').text(stats.eta).css('font-weight','bold');
                    $('#inspectPinModal').modal('show');
                })
            });
        };

        self.getRouteStats = function(directions) {
            var stats = { distance: 0.0, time: 0.0, eta: '(Unknown)' };
            var now = new Date();

            log('Getting route stats...')
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

            var pinId = $('#inspectPinModal input[name="pin_id"]').val();
            self.getPinById(pinId, function(err, thePin) {
                log('Giving a hand to: ' + pinId);
                currentPin = thePin;
                self.getDirectionsToPin(thePin, function(err, directions) {
                    if (!err) {
                      log('=== DISPLAYING ROUTE ===');
                      self.directionsDisplay.setDirections(directions);
                      deliveryUnderway = true;
                      $('.cancel-complete').fadeIn('fast');
                    }
                });
            })
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
                    log('Directions: acquired')
                    callback(null, response);
                }
                else {
                    log('ERROR getting directions')
                    callback(status, response);
                }
            });
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

        // Handle map resets
        $scope.$on('resetMap', function(event, args) {
            log('Received Event: resetMap');
            self.init();
        });
    }]);



})();
