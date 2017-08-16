# Leaflet.MarkerCluster.PlacementStrategies
**subplugin for the [Leaflet.MarkerCluster](https://github.com/Leaflet/Leaflet.markercluster) that implements new possibilities how to place clustered markers**

### How to use:
1. include Leaflet and Leaflet.MarkerCluster libraries (cdnjs, ungkg, npm install, ...)

2. download and include built [leaflet-markercluster.placementstrategies.js](https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/blob/master/dist/leaflet-markercluster.placementstrategies.js) or [leaflet-markercluster.placementstrategies.src.js](https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/blob/master/dist/leaflet-markercluster.placementstrategies.src.js) file from dist folder.

3. create an L.markerClusterGroup instance, add markers and define placement strategy and othe options:

```
var markers = L.markerClusterGroup({
  spiderLegPolylineOptions: {weight: 0},
  clockHelpingCircleOptions: {weight: .7, opacity: 1, color: 'black', fillOpacity: 0, dashArray: '10 5'},

  elementsPlacementStrategy: 'clock',
  helpingCircles: true,

  spiderfyDistanceSurplus: 25,
  spiderfyDistanceMultiplier: 1,

  elementsMultiplier: 1.4,
  firstCircleElements: 8

});

for (var i = 0; i < 10000; i++) {
  var circle = L.circleMarker([Math.random() * 30, Math.random() * 30], {fillOpacity: 0.7, radius: 8, fillColor: 'red',
  color: 'black'});
  markers.addLayer(circle);
}

map.addLayer(markers);
```


### How to build:
1. install npm modules `npm install`
2. run build command `npm run build`

`npm start` will watch and build on changes


### Placement Strategies
* **default** - one-circle strategy up to 8 elements, else spiral strategy
* **spiral** - snail/spiral placement

    ![image](https://raw.githubusercontent.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/master/assets/img_strategy_spiral.png)

* **one-circle** - put all the elements into one circle

    ![image](https://raw.githubusercontent.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/master/assets/img_strategy_onecircle.png)

* **concentric** - elements are placed automatically into concentric circles, there is a maximum of 4 circles

    ![image](https://raw.githubusercontent.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/master/assets/img_strategy_concentric.png)

* **clock** - fills circles around the cluster marker in the style of clocks

    ![image](https://raw.githubusercontent.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/master/assets/img_strategy_clock.png)

* **clock-concentric** - in the case of one circle, elements are places based on the concentric style, more circles are dislocated in the clock style

* **original-locations** - elements are placed at their original locations

    ![image](https://raw.githubusercontent.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies/master/assets/img_strategy_original.png)

**can be changed - _circleSpiralSwitchover variable in the original markerCLuster code*  


### Helping Circles
new type geometry called "helpingCircle" is added and can be used for the last three strategies to make the cluster more visually-consistent.


### Options
 * **elementsPlacementStrategy** (default value 'clock-concentric') - defines the strategy for placing markers in cluster, see above



#### Options that are valid for placement strategies 'concentric', 'clock' and 'clock-concentric'

 * **firstCircleElements** (default value **10**) - number of elements in the first circle

 * **elementsMultiplier** (default value **1.5**) - multiplicator of elements number in the next circle

 * **spiderfyDistanceSurplus** (default value **30**) - value to be added to each new circle distance

 * **helpingCircles** (default value **true**) - will draw helping circles

 * **helpingCircleOptions** (default value **{ fillOpacity: 0, color: 'grey', weight: 0.6 }** ) - possibility to specify helpingCircle style


### Notes:
 - this subplugin was not tested with the animations turned on
 - circleMarkers should be prefered to markers


### Demo:
[random data demo](https://adammertel.github.io/Leaflet.MarkerCluster.PlacementStrategies/demo/demo1.html)
