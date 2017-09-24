
var autocompletePu, autocompleteDes;
var markers = [];
var map;
var geocoder;
var pudoPoints = [{}];
var possibleRoutes = [[]];
var drawnRoutes = [];
var selectedRoute = [];
var directionsService;
var routes = [];

function initAutocomplete() {

    var bcit = {lat: 49.283143, lng: -123.115088};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 17,
        center: bcit
    });

    geocoder = new google.maps.Geocoder;

    autocompletePu = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */(document.getElementById('autocompletePu')),
        {types: ['geocode']});

    autocompletePu.addListener('place_changed', fillInAddressPu);

    autocompleteDes = new google.maps.places.Autocomplete(
        /** @type {!HTMLInputElement} */(document.getElementById('autocompleteDes')),
        {types: ['geocode']});

    autocompleteDes.addListener('place_changed', fillInAddressDes);

    // // route plotting
    // document.getElementById('find_driver_btn').addEventListener('click', function() {
    //   displayPossibleRoutes();
    // });

    // directionsService = new google.maps.DirectionsService();
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

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://evopool-backend.staging.inputhealth.flynnhosting.net/api/riders/trips/search", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    var req = {"start_at" : document.getElementById('time').value.toString(), "from" : {"lat" : markers[0].getPosition().lat(), "lng" : markers[0].getPosition().lng()}, "to" : {"lat" : markers[1].getPosition().lat(), "lng" : markers[1].getPosition().lng()}};
    // console.log(JSON.stringify(req));
    xhttp.send(JSON.stringify(req));
    // var response = JSON.parse(xhttp.responseText);
    var response = xhttp.responseText;
    // console.log(xhttp.responseText);

  // TODO: request server to receive route and waypoints
    // possibleRoutes =
    // [[{lat: 49.2834511, lng: -123.1174435}, {lat: 50.2814521, lng: -123.1155755}, {lat: 51.2837886, lng: -123.116005}, {lat: 53.2803221, lng: -123.112195}],
    // [{lat: 50.2834511, lng: -122.1174435}, {lat: 48.28112, lng: -124.1140618}, {lat: 47.2803221, lng: -121.112195}, {lat: 51.2778357, lng: -125.1088233}]];
    // console.log(JSON.parse(response));

}





// var render_direction = function(direction_result) {
//     renderer = new google.maps.DirectionsRenderer( {'draggable':true} );
//     renderer.setMap(map);
//     renderer.setDirections(direction_result);
//     return renderer;
// }

// // route plotting
// function displayPossibleRoutes() {
//   // var directionsService;
//   var directionsDisplay;
//
//   for (var i = 0; i < possibleRoutes.length; i++) {
//     // directionsService = new google.maps.DirectionsService();
//     directionsDisplay = new google.maps.DirectionsRenderer();
//     directionsDisplay.setMap(map);
//
//     // plot all possible routes
//     var waypts = [];
//     possibleRoutes[i].slice(1, possibleRoutes[i].length-1).forEach(function(latlng) {
//       waypts.push({
//         location: new google.maps.LatLng(latlng.lat, latlng.lng),
//         stopover: true
//       });
//     });
//
//     // for (var i=0; i<waypts.length; i++)
//     //     console.log(waypts[i].location.lat());
//       // console.log(possibleRoutes[i].length);
//     // console.log("i: " + i + ", lat: " + possibleRoutes[i][0].lat + ", lng: " + possibleRoutes[i][0].lng);
//
//
//       origin = new google.maps.LatLng(possibleRoutes[i][0].lat, possibleRoutes[i][0].lng);
//       destination = new google.maps.LatLng(possibleRoutes[i][possibleRoutes[i].length-1].lat, possibleRoutes[i][possibleRoutes[i].length-1].lng);
//
//       console.log(possibleRoutes.length + " i: " + i + ", " + origin + " " + destination);
//
//       directionsService.route({ origin: origin, destination:  destination, waypoints: waypts, 'travelMode': google.maps.DirectionsTravelMode.DRIVING},function(res,sts) {
//           renderer = new google.maps.DirectionsRenderer( {'draggable':true} );
//           renderer.setMap(map);
//           renderer.setDirections(res);
//           console.log("i: " + i + ", " + origin + " " + destination);
//       })
//
//
//
//
//     // directionsService.route({
//     //   origin: new google.maps.LatLng(possibleRoutes[i][0].lat, possibleRoutes[i][0].lng),
//     //   destination: new google.maps.LatLng(possibleRoutes[i][possibleRoutes[i].length-1].lat, possibleRoutes[i][possibleRoutes[i].length-1].lng),
//     //   waypoints: waypts,
//     //   optimizeWaypoints: true,
//     //   'travelMode': 'DRIVING'
//     // }, function(response, status) {
//     //   if (status === 'OK') {
//     //     directionsDisplay.setDirections(response);
//     //     // var route = response.routes[0];
//     //     // var summaryPanel = document.getElementById('directions-panel');
//     //     // summaryPanel.innerHTML = '';
//     //     // For each route, display summary information.
//     //     // for (var i = 0; i < route.legs.length; i++) {
//     //     //   var routeSegment = i + 1;
//     //     //   summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
//     //     //       '</b><br>';
//     //     //   summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
//     //     //   summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
//     //     //   summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
//     //     // }
//     //   } else {
//     //     window.alert('Directions request failed due to ' + status);
//     //   }
//     // });
//
//
//
//
//
//   }
// }
