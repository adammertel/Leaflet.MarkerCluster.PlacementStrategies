
/*
  markerCluster placement-strategies subplugin for leaflet.markercluster
  https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies
  Adam Mertel | univie
*/
"use strict";/*global L:true*/L.MarkerClusterGroup.include({_noanimationUnspiderfy:function a(){if(this._spiderfied){//this._spiderfied._noanimationUnspiderfy();
this._spiderfied.unspiderfy()}}});L.MarkerCluster.include({spiderfy:function a(){var b=this._group;var c=b.options;if(b._spiderfied===this||b._inZoomAnimation){return}var d=this.getAllChildMarkers();var e=b._map;var f=e.latLngToLayerPoint(this._latlng);var g=[];// add options.spiderfiedClassName to the spiderfied markers
if(c.spiderfiedClassName){for(var h in d){var i=d[h];// marker
if(i.getIcon){var j=i.getIcon();if(j){if(j.options.className){if(!j.options.className.includes(c.spiderfiedClassName)){j.options.className+=" "+c.spiderfiedClassName}}else{j.options.className=c.spiderfiedClassName}}//circleMarker
}else if(d[h].setStyle){var k=d[h].options.className;d[h].setStyle({className:k+" "+c.spiderfiedClassName})}}}b._unspiderfy();b._spiderfied=this;this._clockHelpingGeometries=[];// TODO Maybe: childMarkers order by distance to center
// applies chosen placement strategy
switch(c.elementsPlacementStrategy){case"default":if(d.length>=this._circleSpiralSwitchover){g=this._generatePointsSpiral(d.length,f)}else{g=this._generatePointsCircle(d.length,f)}break;case"spiral":g=this._generatePointsSpiral(d.length,f);break;case"one-circle":g=this._generatePointsCircle(d.length,f);break;case"concentric":g=this._generatePointsConcentricCircles(d.length,f);break;case"clock":g=this._generatePointsClocksCircles(d.length,f,false);break;case"clock-concentric":g=this._generatePointsClocksCircles(d.length,f,true);break;case"original-locations":g=this._getOriginalLocations(d,b._map);break;default:}this._animationSpiderfy(d,g)},unspiderfy:function a(b){// remove _supportiveGeometries from map
this._removeClockHelpingCircles();/// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>
if(this._group._inZoomAnimation){return}this._animationUnspiderfy(b);this._group._spiderfied=null},_generatePointsCircle:function a(b,c){var d=this._group.options.spiderfyDistanceMultiplier*this._circleFootSeparation*(2+b),e=d/this._2PI,//radius from circumference
f=this._2PI/b,g=[];var h,j;g.length=b;for(h=b-1;h>=0;h--){j=this._circleStartAngle+h*f;g[h]=new L.Point(c.x+e*Math.cos(j),c.y+e*Math.sin(j))._round()}this._createHelpingCircle(c,e);return g},_generatePointsSpiral:function a(b,c){var d=this._group.options.spiderfyDistanceMultiplier,e=d*this._spiralFootSeparation,f=d*this._spiralLengthFactor*this._2PI,g=[];var h,j=0;var k=d*this._spiralLengthStart;g.length=b;// Higher index, closer position to cluster center.
for(h=b-1;h>=0;h--){j+=e/k+h*0.0005;g[h]=new L.Point(c.x+k*Math.cos(j),c.y+k*Math.sin(j))._round();k+=f/j}return g},// auxiliary method - returns placement of vertex of given regular n-side polygon
_regularPolygonVertexPlacement:function a(b,c,d,e){var f=this._2PI/c;var g=f*b;// in case of two vertices, right-left placement is more estetic
if(c!==2){g-=1.6}return new L.Point(d.x+Math.cos(g)*e,d.y+Math.sin(g)*e)._round()},// clock strategy placement.
// regularFirstCicle parameter - true if first elements in the first circle are placed regularly
_generatePointsClocksCircles:function a(b,c,d){var e=[];var f=this._group.options;var g=f.firstCircleElements;var h=this._circleFootSeparation*1.5,// offset of the first circle
j=f.spiderfyDistanceMultiplier,// multiplier of the offset for a next circle
k=f.spiderfyDistanceSurplus,// multiplier of the offset for a next circle
l=f.elementsMultiplier;// multiplier of number of elements in the next circle
var m=1,n=g,o=h,p=0;this._createHelpingCircle(c,o);// iterating elements
for(var q=1;q<=b;q++){var r=q-p;// position of current element in this circle
// changing the circle
if(r>n){m+=1;p+=n;r=q-p;// position of current element in this circle
n=Math.floor(n*l);o=(k+o)*j;this._createHelpingCircle(c,o)}if(d&&m===1){e[q-1]=this._regularPolygonVertexPlacement(r-1,Math.min(g,b),c,o)}else{e[q-1]=this._regularPolygonVertexPlacement(r-1,n,c,o)}}return e},// method for creating and storing helping circles for clock/concentric circles strategy
_createHelpingCircle:function a(b,c){var d=this._group;var e=d.options;if(e.helpingCircles){var f={radius:c};// keeping without fill if it is not defined
if(!e.clockHelpingCircleOptions.fill){e.clockHelpingCircleOptions.fillColor="none"}L.extend(f,e.clockHelpingCircleOptions);var g=new L.CircleMarker(d._map.layerPointToLatLng(b),f);d._featureGroup.addLayer(g);this._clockHelpingGeometries.push(g)}},// concentric circles strategy placement.
// divide elements of cluster into concentric zones based on elementsMultiplier and firstCircleElements parameters
_generatePointsConcentricCircles:function a(b,d){var e=this;var f=this._group.options;var g=[];var h=f.firstCircleElements,j=this._circleFootSeparation*1.5,// offset of the first circle
k=f.spiderfyDistanceMultiplier,// multiplier of the offset for a next circle
c=f.elementsMultiplier,// multiplier of number of elements in the next circle
l=f.spiderfyDistanceSurplus,// multiplier of the offset for a next circle
m=Math.round(h*c);// number of elements in the second circle
var n=[{distance:j,noElements:0},{distance:(l+j)*k,noElements:0},{distance:(2*l+j)*k*k,noElements:0},{distance:(3*l+j)*k*k*k,noElements:0}];// number of points in the second circle
if(b>h){n[1].noElements=m;if(h<b&&b<2*h||h+m<b&&b<2*h+m){n[1].noElements=h}}// number of points in the third circle
if(b>h+Math.round(h*c)){n[2].noElements=Math.round(h*c)}if(b>h+2*Math.round(h*c)){n[2].noElements=Math.round(h*c*c)}if(b>h+Math.round(h*c)+Math.round(h*c*c)){n[2].noElements=Math.round(h*c)}if(b>h+2*Math.round(h*c)+Math.round(h*c*c)){n[2].noElements=Math.round(h*c*c)}// number of points in the first circle
n[0].noElements=Math.min(b-n[1].noElements-n[2].noElements,h);// number of points in the fourth circle
n[3].noElements=Math.max(b-n[0].noElements-n[1].noElements-n[2].noElements,0);var o=0;// number of elements in the finished circles
var p=n[0];// curretly driven circle
// iterating elements
for(var q=1;q<=b;q++){// changing to the new circle
if(n[1].noElements>0){if(q>n[0].noElements){p=n[1];o=n[0].noElements}if(q>n[0].noElements+n[1].noElements&&n[2].noElements>0){p=n[2];o=n[0].noElements+n[1].noElements}if(q>n[0].noElements+n[1].noElements+n[2].noElements&&n[3].noElements>0){p=n[3];o=n[0].noElements-n[1].noElements-n[2].noElements}}g[q-1]=this._regularPolygonVertexPlacement(q-o,p.noElements,d,p.distance)}n.filter(function(a){return a.noElements}).map(function(a){return e._createHelpingCircle(d,a.distance)});return g},_removeClockHelpingCircles:function a(b){if(this._group.options.helpingCircles){for(var c in this._clockHelpingGeometries){var d=this._group._featureGroup;d.removeLayer(this._clockHelpingGeometries[c])}}},_getOriginalLocations:function a(b,c){var d=[];b.forEach(function(a){d.push(c.latLngToLayerPoint(a.getLatLng()))});return d}});"use strict";/*global L:true*/L.MarkerClusterGroup.include({options:{maxClusterRadius:80,//A cluster will cover at most this many pixels from its center
iconCreateFunction:null,clusterPane:L.Marker.prototype.options.pane,spiderfyOnMaxZoom:true,showCoverageOnHover:true,zoomToBoundsOnClick:true,singleMarkerMode:false,disableClusteringAtZoom:null,// extra className that will be assigned to spiderfied child markers
spiderfiedClassName:false,// Setting this to false prevents the removal of any clusters outside of the viewpoint, which
// is the default behaviour for performance reasons.
removeOutsideVisibleBounds:true,// Method of cluster elements placements
// 'default' - one-circle strategy up to 8 elements (could be changed), then spiral strategy
// 'spiral' - snail/spiral placement
// 'one-circle' - put all the elements into one circle
// 'concentric' - elements are placed automatically into concentric circles, there is a maximum of 4 circles
// 'clock' - fills circles around the cluster marker in the style of clocks
// 'clock-concentric' - in case of one circle, elements are places based on the concentric style, more circles are in clock style
elementsPlacementStrategy:"clock-concentric",// Options that are valid for placement strategies 'concentric', 'clock' and 'clock-concentric'
// Number of elements in the first circle
firstCircleElements:10,// multiplicator of elements number for the next circle
elementsMultiplier:1.5,// Value to be added to each new circle
spiderfyDistanceSurplus:30,// will draw additional helping circles
helpingCircles:true,// Possibility to specify helpingCircle style
clockHelpingCircleOptions:{color:"grey",dashArray:"5",fillOpacity:0,opacity:0.5,weight:3},// Set to false to disable all animations (zoom and spiderfy).
// If false, option animateAddingMarkers below has no effect.
// If L.DomUtil.TRANSITION is falsy, this option has no effect.
animate:false,// Whether to animate adding markers after adding the MarkerClusterGroup to the map
// If you are adding individual markers set to true, if adding bulk markers leave false for massive performance gains.
animateAddingMarkers:false,// Increase to increase the distance away that spiderfied markers appear from the center
spiderfyDistanceMultiplier:1,// Make it possible to specify a polyline options on a spider leg
spiderLegPolylineOptions:{weight:1.5,color:"#222",opacity:0.5},// When bulk adding layers, adds markers in chunks. Means addLayers may not add all the layers in the call, others will be loaded during setTimeouts
chunkedLoading:false,chunkInterval:200,// process markers for a maximum of ~ n milliseconds (then trigger the chunkProgress callback)
chunkDelay:50,// at the end of each interval, give n milliseconds back to system/browser
chunkProgress:null,// progress callback: function(processed, total, elapsed) (e.g. for a progress indicator)
// Options to pass to the L.Polygon constructor
polygonOptions:{}}});
