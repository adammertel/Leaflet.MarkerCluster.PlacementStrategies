# Leaflet.MarkerCluster.PlacementStrategies
** subplugin for the [Leaflet.MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster) that implements new possibilities how to place markers

### How to use:
 - 1. include Leaflet and Leaflet.MarkerCluster libraries:

`
 <link rel="stylesheet" href="https://unpkg.com/leaflet@1.0.1/dist/leaflet.css" />
 <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.1/leaflet.js"></script>

 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.0.0-rc.1.0/MarkerCluster.css" />
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.0.0-rc.1.0/MarkerCluster.Default.css" />
 <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.0.0-rc.1.0/leaflet.markercluster.js"></script>
`

- 2. download and include built: [leaflet-markercluster.placementstrategies.js](https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/blob/master/dist/leaflet-markercluster.placementstrategies.js) or [leaflet-markercluster.placementstrategies.src.js]https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/blob/master/dist/leaflet-markercluster.placementstrategies.src.js) file and also include it.


- 3. create an L.markerClusterGroup instance, add markers and define placement strategy and othe options:

`
var markers = L.markerClusterGroup({
  spiderLegPolylineOptions: {weight: 0},
  clockHelpingCircleOptions: {weight: .7, opacity: 1, color: 'black', fillOpacity: 0, dashArray: '10 5'},

  elementsPlacementStrategy: 'clock',
  helpingCircles: true,

  spiderfyDistanceSurplus: 25,
  spiderfyDistanceMultiplier: 1,

  elementsMultiplier: 1.4,
  firstCircleElements: fcircle
});

for (var i = 0; i < 10000; i++) {
  var circle = L.circleMarker([Math.random() * 30, Math.random() * 30], {fillOpacity: 0.7, radius: 8, fillColor: 'red', color: 'black'});
  markers.addLayer(circle);
}

map.addLayer(markers);
`

### Notes:
 - this subplugin was not tested with the animations turned on

### Placement Strategies
* **default** - one-circle strategy up to 8 elements (could be changed), else spiral strategy
* **spiral** - snail/spiral placement

![image](https://cloud.githubusercontent.com/assets/12932677/19441858/8d173ffe-9487-11e6-9cad-d4996c4b8673.png)

* **one-circle** - put all the elements into one circle

![image](https://cloud.githubusercontent.com/assets/12932677/19441871/94311d32-9487-11e6-8797-fcd0033febb2.png)

* **concentric** - elements are placed automatically into concentric circles, there is a maximum of 4 circles

![image](https://cloud.githubusercontent.com/assets/12932677/19441875/996cd502-9487-11e6-98e2-c51973ce3fed.png)

* **clock** - fills circles around the cluster marker in the style of clocks

![image](https://cloud.githubusercontent.com/assets/12932677/19441883/9e84b1ae-9487-11e6-8ea8-4505d0148397.png)

* **clock-concentric** - in the case of one circle, elements are places based on the concentric style, more circles are dislocated in the clock style


### Helping Circles
There is also another new type geometry called "helpingCircle" that could be used for the last three strategies to make the cluster more consistent.

### Options
**elementsPlacementStrategy** (default value 'clock-concentric') - defines the strategy for placing markers in cluster, see above

*Options that are valid for placement strategies 'concentric', 'clock' and 'clock-concentric'*
**firstCircleElements** (default value 10) - number of elements in the first circle
**elementsMultiplier** (default value 1.5) - multiplicator of elements number in the next circle
**spiderfyDistanceSurplus** (default value 30) - value to be added to each new circle distance
**helpingCircles** (default value true) - will draw helping circles
**helpingCircleOptions** (default value { fillOpacity: 0, color: 'grey', weight: 0.6 }) - possibility to specify helpingCircle style


### Notes:
 - this subplugin was not tested with the animations turned on


### Demo:
please see the demo here: https://jsfiddle.net/qumjcjb3/25/.
