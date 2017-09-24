var map, renderer, service, autocompleteFrom, autocompleteTo, origin, 
    destination, geocoder, markers=[], waypoints=[];

function initMap() {
    map = new google.maps.Map( document.getElementById('mappy'), {
        zoom: 12, 
        mapTypeId: google.maps.MapTypeId.ROADMAP, 
        center: new google.maps.LatLng(49.2796502,-123.1116371,15) 
    })
    renderer = new google.maps.DirectionsRenderer({'draggable': true});
    renderer.setMap(map);
    service = new google.maps.DirectionsService();

    geocoder = new google.maps.Geocoder;
    autocompleteFrom = new google.maps.places.Autocomplete(
        (document.getElementById('autocompleteFrom')),
        {types: ['geocode']});
    autocompleteFrom.addListener('place_changed', fillInAddressFrom);

    autocompleteTo = new google.maps.places.Autocomplete(
        (document.getElementById('autocompleteTo')),
        {types: ['geocode']});
    autocompleteTo.addListener('place_changed', fillInAddressTo);
}

function fillInAddressFrom() {
    var place = autocompleteFrom.getPlace();
    origin = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};
    if (origin && destination) {
        createRoute()
    } else {
        addMarker(origin, 0);
    }
}

function fillInAddressTo() {
    var place = autocompleteTo.getPlace();
    destination = {lat: place.geometry.location.lat(), lng: place.geometry.location.lng()};
    if (origin && destination) {
        createRoute()
    } else {
        addMarker(destination, 1);
    }
}

function createRoute() {
    if (markers[0]) {deleteMarker(0)}
    if (markers[1]) {deleteMarker(1)}
    service.route({ 'origin': origin, 'destination':  destination, 'travelMode': google.maps.DirectionsTravelMode.DRIVING},function(res,sts) {
        if(sts=='OK')renderer.setDirections(res);
    }) 
}


function addMarker(location, index) {
    if (index == 0) {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            label: "A"
        });
    } else {
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            label: "B"
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
        if (type == "origin") {
            origin = event.latLng;
            if (origin && destination) {
                createRoute()
            } else {
                addMarker(origin, 0);
            }
            setAddress(event.latLng, "origin");
            google.maps.event.clearListeners(map, 'click');
        }
        else {
            destination = event.latLng;
            if (origin && destination) {
                createRoute()
            } else {
                addMarker(destination, 1);
            }
            setAddress(event.latLng, "destination");
            google.maps.event.clearListeners(map, 'click');
        }
    });
}

function setAddress(latlng, type) {
    geocoder.geocode({'location': latlng}, function(results, status) {
        if (status === 'OK') {
            if (results[1]) {
                if (type == "origin")
                    document.getElementById('autocompleteFrom').value = results[1].formatted_address;
                else
                    document.getElementById('autocompleteTo').value = results[1].formatted_address;
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}

function render_waypoints() {
    var rleg = renderer.directions.routes[0].legs[0];
    var wp = rleg.via_waypoints
    for (var i=0;i<wp.length;i++) {
        waypoints[i] = [wp[i].lat(),wp[i].lng()]
    }
}

function sendData() {
    render_waypoints();
    var data = {
        start_at: {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value
        },
        directions: {
            start: {
                lat: origin.lat(),
                lng: origin.lng()
            },
            end: {
                lat: destination.lat(),
                lng: destination.lng()
            },
            waypoints: waypoints
        },
        stops: [],
        passengers: document.getElementById('passengers').value
    }
    console.log(data);
}
