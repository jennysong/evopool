
var autocompletePu, autocompleteDes;
var markers = [];
var map;
var geocoder;
var possibleRoutes = [[]];
var drawnRoutes = [];
var selectedRoute;
var DirectionsService;
var routes = [];
var routeStats = [];
var DirectionsService, latest_renderer;
var CARBON_EMISSION_RATE = 0.11;

function initAutocomplete() {

    DirectionsService = new google.maps.DirectionsService();
    var nvan = {lat: 49.273376, lng: -123.103834};
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: nvan
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

    // route plotting
}

var render_direction = function(direction_result) {
  renderer = new google.maps.DirectionsRenderer();
  renderer.setMap(map);
  renderer.setDirections(direction_result);
  return renderer;
}

var render_direction_from_attrs = function(attrs, callback) {
  origin = new google.maps.LatLng(attrs.start.lat, attrs.start.lng)
  destination = new google.maps.LatLng(attrs.end.lat, attrs.end.lng)
  waypoints = attrs.waypoints.map(function(lat_lng) { return {location: new google.maps.LatLng(lat_lng[0], lat_lng[1]), stopover:false} })

  DirectionsService.route({ origin: origin, destination:  destination, waypoints: waypoints, 'travelMode': google.maps.DirectionsTravelMode.DRIVING},function(res,sts) {
    if(callback instanceof Function) callback(res);
  })
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
  // send points to the server
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://evopool-backend.staging.inputhealth.flynnhosting.net/api/riders/trips/search", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    var req = {"start_at" : document.getElementById('time').value.toString(), "from" : {"lat" : markers[0].getPosition().lat(), "lng" : markers[0].getPosition().lng()}, "to" : {"lat" : markers[1].getPosition().lat(), "lng" : markers[1].getPosition().lng()}};
    // console.log(JSON.stringify(req));
    xhttp.send(JSON.stringify(req));
    xhttp.onreadystatechange = function () {
      if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
        JSON.parse(xhttp.responseText).forEach(function(obj) {
            routes.push(obj);
        });
        if(routes.length == 0) alert('nothing to show')
        routes.forEach(function(trip_attrs) {
          render_direction_from_attrs(trip_attrs.directions, function(result) {
            latest_renderer = render_direction(result);
          });
        });

        // Calculate optimal total travel for each route
        routes.forEach(function(route, i) {
          routeStats[i] = {};
          routeStats[i].id = route.id;
          routeStats[i].origin = new google.maps.LatLng(markers[0].getPosition().lat(), markers[0].getPosition().lng());
          routeStats[i].origin_stop_id = route.origin_stop_id;
          routeStats[i].destination_stop_id = route.destination_stop_id;
          routeStats[i].destination = new google.maps.LatLng(markers[1].getPosition().lat(), markers[1].getPosition().lng());
          routeStats[i].waypoints = [];
          routeStats[i].waypoints.push({location: new google.maps.LatLng(route.origin_stop[0], route.origin_stop[1]), stopover:false});
          routeStats[i].waypoints.push({location: new google.maps.LatLng(route.destination_stop[0], route.destination_stop[1]), stopover:false});

          var dist = 0, dur = 0;
          var request1 = {
            origin: markers[0].getPosition().lat() + ", " + markers[0].getPosition().lng(),
            destination: route.origin_stop[0] + ", " + route.origin_stop[1],
            travelMode: google.maps.DirectionsTravelMode.WALKING
          };
          DirectionsService.route(request1, function(response1, status1) {
            if ( status1 == google.maps.DirectionsStatus.OK ) {
              console.log("res1, dist: " + response1.routes[0].legs[0].distance.value + ", dur: " + response1.routes[0].legs[0].duration.value);
              dist += response1.routes[0].legs[0].distance.value;
              dur += response1.routes[0].legs[0].duration.value;

              var request2 = {
                origin: route.origin_stop[0] + ", " + route.origin_stop[1],
                destination: route.destination_stop[0] + ", " + route.destination_stop[1],
                travelMode: google.maps.DirectionsTravelMode.DRIVING
              };
              DirectionsService.route(request2, function(response2, status2) {
                if ( status2 == google.maps.DirectionsStatus.OK ) {
                  console.log("res2, dist: " + response2.routes[0].legs[0].distance.value + ", dur: " + response2.routes[0].legs[0].duration.value);
                  dist += response2.routes[0].legs[0].distance.value;
                  dur += response2.routes[0].legs[0].duration.value;

                  var request3 = {
                    origin: route.destination_stop[0] + ", " + route.destination_stop[1],
                    destination: markers[1].getPosition().lat() + ", " + markers[1].getPosition().lng(),
                    travelMode: google.maps.DirectionsTravelMode.WALKING
                  };
                  DirectionsService.route(request3, function(response3, status3) {
                    if ( status3 == google.maps.DirectionsStatus.OK ) {
                      console.log("res3, dist: " + response3.routes[0].legs[0].distance.value + ", dur: " + response3.routes[0].legs[0].duration.value);
                      dist += response3.routes[0].legs[0].distance.value;
                      dur += response3.routes[0].legs[0].duration.value;
                      routeStats[i].distance = dist;
                      routeStats[i].duration = dur;
                      sortByDuration(routeStats);
                      createTable();
                    }
                  });
                }
              });
            }
          }); // request1
        }); // routes

        console.log(routeStats);
        // createTable();

      }
    };
}

function sortByDuration(RouteStats) {
    RouteStats.forEach(function(route) {
        RouteStats.sort(function(a, b) {
            return a.duration - b.duration;
        })
    })
}

function createTable() {

    var myTable= "<table class=\"table table-striped\"><tr><td style='width: 100px; color: red;'>Routes</td>";
    myTable+= "<td style='width: 100px; color: red; text-align: right;'>Travel Time</td>";
    myTable+="<td style='width: 100px; color: red; text-align: right;'>Total Distance</td>";
    myTable+="<td style='width: 100px; color: red; text-align: right;'>Reserve</td></tr>";

    for (var i=0; i<routeStats.length; i++) {
        myTable+="<tr><td style='width: 100px;'>Option " + (i+1) + "</td>";
        myTable+="<td style='width: 100px; text-align: right;'>" + Math.round(routeStats[i].duration*100/60)/100 + " mins</td>";
        myTable+="<td style='width: 100px; text-align: right;'>" + Math.round(routeStats[i].distance*100/1000)/100 + " km</td>";
        myTable+="<td style='width: 100px; text-align: right;'><div id=\"floating-panel\"><button data-toggle=\"modal\" data-target=\"#myModal\" id=" + routeStats[i].id + " onclick=\"reserve(this.id);\">Reserve!</button>" + "</div></td></tr>";
    }
    myTable+="</table>";

    // document.write( myTable);
    document.getElementById('tablePrint').innerHTML = myTable;
}

function reserve(routeId) {
    var route = routeStats.filter(function(r) {
        if (r.id == routeId) return r;
    })[0];

    var carbon_emission = Math.round(route.distance * CARBON_EMISSION_RATE * 100 / 1000) / 100;

    document.getElementById('carbon-emission').innerText = carbon_emission + " L of CO2!";

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://evopool-backend.staging.inputhealth.flynnhosting.net/api/riders/rides", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    var req = {"trip_id" : route.id, "origin_stop_id" : route.origin_stop_id, "destination_stop_id" : route.destination_stop_id};
    // console.log(JSON.stringify(req));
    xhttp.send(JSON.stringify(req));
    xhttp.onreadystatechange = function () {
        if(xhttp.readyState === XMLHttpRequest.DONE && xhttp.status === 200) {
            // JSON.parse(xhttp.responseText).forEach(function (obj) {
            //     routes.push(obj);
            // });
            // if (routes.length == 0) alert('nothing to show')
            console.log(JSON.parse(xhttp.responseText));

        }
    }
}