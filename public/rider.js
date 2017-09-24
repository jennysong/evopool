
var autocompletePu, autocompleteDes;
var markers = [];
var map;
var geocoder;
var pudoPoints = [{}];
var possibleRoutes =
[[{lat: 49.283143, lng: -123.115088}, {lat: 51.283143, lng: -133.115088}, {lat: 64.283143, lng: -126.115088}, {lat: 47.283143, lng: -129.115088}],
[{lat: 49.503143, lng: -123.415088}, {lat: 51.883143, lng: -133.215088}, {lat: 63.283143, lng: -126.715088}, {lat: 48.283143, lng: -129.145088}]]; // list of routes
var selectedRoute = [];

function initAutocomplete() {

    var bcit = {lat: 49.283143, lng: -123.115088};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: bcit
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;

    geocoder = new google.maps.Geocoder;

    autocompletePu = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */(document.getElementById('autocompletePu')),
        {types: ['geocode']});

    autocompletePu.addListener('place_changed', fillInAddressPu);

    autocompleteDes = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */(document.getElementById('autocompleteDes')),
        {types: ['geocode']});

    autocompleteDes.addListener('place_changed', fillInAddressDes);

    // route plotting
    directionsDisplay.setMap(map);

    document.getElementById('find_driver_btn').addEventListener('click', function() {
      displayPossibleRoutes(directionsService, directionsDisplay);
    });
}

function fillInAddressPu() {
    var place = autocompletePu.getPlace();

    var mk = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};

    addMarker(mk, 0);
}

function fillInAddressDes() {
    var place = autocompleteDes.getPlace();

    var mk = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};

    addMarker(mk, 1);
}


function geolocate(type) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var geolocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
                center: geolocation,
                radius: position.coords.accuracy
            });
            if (type == "pu")
                autocompletePu.setBounds(circle.getBounds());
            else
                autocompleteDes.setBounds(circle.getBounds());
        });
    }
}


function addMarker(location, index) {
    if (index == 0) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            label: "From"
        });
    } else {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            label: "To"
        });
    }
    markers[index] = marker;
}

function deleteMarker(index) {
    markers[index].setMap(null);
    markers[index] = null;
}

function clickPoint(type) {
    map.addListener('click', function(event) {
        if (type == "pu") {
            if (markers[0] != null)
                deleteMarker(0);
            addMarker(event.latLng, 0);
            setAddress(event.latLng, "pu");
            google.maps.event.clearListeners(map, 'click');
        }
        else {
            if (markers[1] != null)
                deleteMarker(1);
            addMarker(event.latLng, 1);
            setAddress(event.latLng, "des");
            google.maps.event.clearListeners(map, 'click');
        }
    });
}

function resetPoint(type) {
    if (type == "pu")
        deleteMarker(0);
    else
        deleteMarker(1);
}

function setAddress(latlng, type) {
    geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === 'OK') {
            if (results[1]) {
                if (type == "pu")
                    document.getElementById('autocompletePu').value = results[1].formatted_address;
                else
                    document.getElementById('autocompleteDes').value = results[1].formatted_address;
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}


function sendPoints() {
  // TODO: send these points to the server
    console.log(markers[0].getPosition().lat() + " , " + markers[0].getPosition().lng());
    console.log(markers[1].getPosition().lat() + " , " + markers[1].getPosition().lng());
    console.log(document.getElementById('time').value);
    console.log(document.getElementById('radius').value);

  // TODO: request server to receive route and waypoints
    pudoPoints = [[]];
    possibleRoutes = [[]];
}

// route plotting
function displayPossibleRoutes(directionsService, directionsDisplay) {

  for (var i = 0; i < possibleRoutes.length; i++) {
    // TODO: plot all possible routes
    var waypts = [];
    possibleRoutes[i].slice(1, possibleRoutes[i].length-1).forEach(function(latlng) {
      waypts.push({
        location: new google.maps.LatLng(latlng.lat, latlng.lng),
        stopover: true
      });
    });
    console.log("i: " + i + ", lat: ");
    directionsService.route({
      origin: new google.maps.LatLng(possibleRoutes[i][0].lat, possibleRoutes[i][0].lng),
      destination: new google.maps.LatLng(possibleRoutes[i][possibleRoutes[i].length-1].lat, possibleRoutes[i][possibleRoutes[i].length-1].lng),
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
        var route = response.routes[0];
        var summaryPanel = document.getElementById('directions-panel');
        summaryPanel.innerHTML = '';
        // For each route, display summary information.
        for (var i = 0; i < route.legs.length; i++) {
          var routeSegment = i + 1;
          summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
              '</b><br>';
          summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
          summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
          summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
        }
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }
}
