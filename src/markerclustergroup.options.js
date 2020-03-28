/*global L:true*/

L.MarkerClusterGroup.include({
  options: {
    maxClusterRadius: 80, //A cluster will cover at most this many pixels from its center
    iconCreateFunction: null,
    clusterPane: L.Marker.prototype.options.pane,

    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    singleMarkerMode: false,

    disableClusteringAtZoom: null,

    // extra className that will be assigned to spiderfied child markers
    spiderfiedClassName: false,

    // Setting this to false prevents the removal of any clusters outside of the viewpoint, which
    // is the default behaviour for performance reasons.
    removeOutsideVisibleBounds: true,

    // Method of cluster elements placements
    // 'default' - one-circle strategy up to 8 elements (could be changed), then spiral strategy
    // 'spiral' - snail/spiral placement
    // 'one-circle' - put all the elements into one circle
    // 'concentric' - elements are placed automatically into concentric circles, there is a maximum of 4 circles
    // 'clock' - fills circles around the cluster marker in the style of clocks
    // 'clock-concentric' - in case of one circle, elements are places based on the concentric style, more circles are in clock style
    elementsPlacementStrategy: "clock-concentric",

    // Options that are valid for placement strategies 'concentric', 'clock' and 'clock-concentric'
    // Number of elements in the first circle
    firstCircleElements: 10,
    // multiplicator of elements number for the next circle
    elementsMultiplier: 1.5,
    // Value to be added to each new circle
    spiderfyDistanceSurplus: 30,
    // will draw additional helping circles
    helpingCircles: true,

    // Possibility to specify helpingCircle style
    clockHelpingCircleOptions: {
      color: "grey",
      dashArray: "5",
      fillOpacity: 0,
      opacity: 0.5,
      weight: 3
    },

    // Set to false to disable all animations (zoom and spiderfy).
    // If false, option animateAddingMarkers below has no effect.
    // If L.DomUtil.TRANSITION is falsy, this option has no effect.
    animate: false,

    // Whether to animate adding markers after adding the MarkerClusterGroup to the map
    // If you are adding individual markers set to true, if adding bulk markers leave false for massive performance gains.
    animateAddingMarkers: false,

    // Increase to increase the distance away that spiderfied markers appear from the center
    spiderfyDistanceMultiplier: 1,

    // Make it possible to specify a polyline options on a spider leg
    spiderLegPolylineOptions: { weight: 1.5, color: "#222", opacity: 0.5 },

    // When bulk adding layers, adds markers in chunks. Means addLayers may not add all the layers in the call, others will be loaded during setTimeouts
    chunkedLoading: false,
    chunkInterval: 200, // process markers for a maximum of ~ n milliseconds (then trigger the chunkProgress callback)
    chunkDelay: 50, // at the end of each interval, give n milliseconds back to system/browser
    chunkProgress: null, // progress callback: function(processed, total, elapsed) (e.g. for a progress indicator)

    // Options to pass to the L.Polygon constructor
    polygonOptions: {}
  }
});
