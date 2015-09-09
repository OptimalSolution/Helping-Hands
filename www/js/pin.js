// The Pin Object
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


            return converted;
        }

    }, {

        create: function(coords, time_at_location) {

            var newPin = new Pin();
            log('Creating pin at: ');
            log(coords);
            newPin.set('needs', []);
            newPin.set('createdBy', Parse.User.current());
            newPin.set('completedBy', null);
            newPin.set('completedAt', null);
            newPin.set('time_at_location', parseInt(time_at_location) || 1); // Default to 1 hour

            var mapPoints = [], n = 0;
            for(var i in coords) {
                if(n <= 1) {
                    mapPoints.push(coords[i]);
                }
                n++;
            }
            newPin.set('coords', new Parse.GeoPoint(mapPoints[0], mapPoints[1]));

            // TODO: Get a time conversion library to do this correctly
            var there_until = new Date();
            there_until.setHours(there_until.getHours() + time_at_location);
            newPin.set('there_until', there_until);
            return newPin;
        }
});
