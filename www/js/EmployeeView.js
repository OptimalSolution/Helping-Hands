var EmployeeView = function(employee) {

    var self = this;
    this.initialize = function() {
        this.el = $('<div/>');
        this.el.on('click', '.add-location-btn', self.addLocation);
        this.el.on('click', '.change-pic-btn', self.changePicture);
    };

    this.changePicture = function(event) {
        event.preventDefault();
        if (!navigator.camera) {
            app.showAlert("Camera API not supported", "Error");
            return;
        }
        var options =   {   quality: 50,
                            destinationType: Camera.DestinationType.DATA_URL,
                            sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Photo Album
                            encodingType: 0     // 0=JPG 1=PNG
                        };

        navigator.camera.getPicture(
            function(imageData) {
                $('.employee-image', this.el).attr('src', "data:image/jpeg;base64," + imageData);
            },
            function() {
                app.showAlert('Error taking picture', 'Error');
            },
            options);

        return false;
    };

    this.render = function() {
        this.el.html(EmployeeView.template(employee));
        return this;
    };

    this.insertMap = function(lat,long) {
      var myLatlng = new google.maps.LatLng(lat,long);
      var map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 16,
        center: myLatlng
      });

      var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: 'My Position'
      });
    };

    this.addLocation = function(event) {
        event.preventDefault();
        console.log('*** addLocation ***');

        //self.insertMap(32.7192297,-117.1650785);
        navigator.geolocation.getCurrentPosition(
            function(position) {
                console.log('*** Location data ***')
                self.insertMap(position.coords.latitude,position.coords.longitude);
                $('.location', this.el).html(position.coords.latitude + ',' + position.coords.longitude);
            },
            function() {
                alert('Error getting location');
        });
        return false;
    };

    this.initialize();
}

EmployeeView.template = Handlebars.compile($("#employee-tpl").html());
