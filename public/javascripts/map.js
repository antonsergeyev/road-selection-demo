// set up leaflet map on a page
let osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
let osmLayer = new L.TileLayer(osmUrl, {minZoom: 3, maxZoom: 19, attribution: osmAttrib});

let map = new L.Map('map');
map.setView(new L.LatLng(37.4498722, -122.1557647), 17);
map.addLayer(osmLayer);

let roads = {};
let body = document.getElementsByTagName("body")[0];

// on a map click, fetch the road nearest to click coordinates
map.on('click', (e) => {
  body.classList.add("is-loading");
  fetch(baseUrl + 'road/' + e.latlng.lat + '/' + e.latlng.lng)
    .then((response) => response.json())
    .then((json) => {
      highlightRoad(json);
      body.classList.remove("is-loading");
    });
});

/**
 * Highlights road on a map
 *
 * @param road
 */
function highlightRoad(road) {
  if (!road || !road.id) {
    // error while querying road
    console.log(road);

    if (road.message) {
      alert(road.message);
    }

    return;
  }

  if (roads[road.id]) {
    return;
  }

  let points = road.geometry.coordinates.map(point => {
      // Overpass returns coordinates in a different order than Leaflet expects
      return [point[1], point[0]]
    }),
    roadLine = L.polyline(points, {
      weight: 10,
      color: '#6080ff',
      opacity: 0.5
    }),
    // show a tooltip with road information
    roadDescription = `<strong>${road.properties.tags.name || "Unknown road"}</strong><br/>
                <pre>${JSON.stringify(road.properties, null, 2)}</pre>`;

  roadLine
    .bindTooltip(roadDescription, {
      sticky: true
    })
    .addTo(map);

  roadLine.addTo(map);

  roads[road.id] = roadLine;

  // when road is clicked again, deselect it
  roadLine.on('click', function (e) {
    L.DomEvent.stop(e);
    deselectRoad(road.id);
  });
}

function deselectRoad(roadId) {
  roads[roadId].remove();
  delete roads[roadId];
}