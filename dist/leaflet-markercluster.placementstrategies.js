
/*
  markerCluster placement-strategies subplugin for leaflet.markercluster
  https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies
  Adam Mertel | univie
*/
"use strict";/*global L:true*/L.MarkerCluster.include({spiderfy:function a(){if(this._group._spiderfied===this||this._group._inZoomAnimation){return}var b=this.getAllChildMarkers();var c=this._group;var d=c._map;var e=d.latLngToLayerPoint(this._latlng);var f=[];if(!(this._group.getLayers()[0]instanceof L.CircleMarker)){e.y+=10}// add a specific className to the spiderfied markers
if(this._group.options.className){var g=this._group.options.className;for(var h in b){var i=b[h];// marker
if(i.getIcon){var j=i.getIcon();if(j){j.options.className=j.options.className+" "+g}//circleMarker
}else if(b[h].setStyle){var k=b[h].options.className;b[h].setStyle({className:k+" "+g})}}}this._group._unspiderfy();this._group._spiderfied=this;this._clockHelpingGeometries=[];// TODO Maybe: childMarkers order by distance to center
// applies chosen placement strategy
switch(this._group.options.elementsPlacementStrategy){case"default":if(b.length>=this._circleSpiralSwitchover){f=this._generatePointsSpiral(b.length,e)}else{f=this._generatePointsCircle(b.length,e)}break;case"spiral":f=this._generatePointsSpiral(b.length,e);break;case"one-circle":f=this._generatePointsCircle(b.length,e);break;case"concentric":f=this._generatePointsConcentricCircles(b.length,e);break;case"clock":f=this._generatePointsClocksCircles(b.length,e,false);break;case"clock-concentric":f=this._generatePointsClocksCircles(b.length,e,true);break;case"original-locations":f=this._getOriginalLocations(b,this._group._map);break;default:}this._animationSpiderfy(b,f)},unspiderfy:function a(b){/// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>
if(this._group._inZoomAnimation){return}this._animationUnspiderfy(b);// remove _supportiveGeometries from map
if(this._group.options.helpingCircles){this._removeClockHelpingCircles(this._group._featureGroup)}this._group._spiderfied=null},_generatePointsCircle:function a(b,c){var d=this._group.options.spiderfyDistanceMultiplier*this._circleFootSeparation*(2+b),e=d/this._2PI,//radius from circumference
f=this._2PI/b,g=[];var h,j;g.length=b;for(h=b-1;h>=0;h--){j=this._circleStartAngle+h*f;g[h]=new L.Point(c.x+e*Math.cos(j),c.y+e*Math.sin(j))._round()}return g},_generatePointsSpiral:function a(b,c){var d=this._group.options.spiderfyDistanceMultiplier,e=d*this._spiralFootSeparation,f=d*this._spiralLengthFactor*this._2PI,g=[];var h,j=0;var k=d*this._spiralLengthStart;g.length=b;// Higher index, closer position to cluster center.
for(h=b-1;h>=0;h--){j+=e/k+h*0.0005;g[h]=new L.Point(c.x+k*Math.cos(j),c.y+k*Math.sin(j))._round();k+=f/j}return g},// auxiliary method - returns placement of vertex of given regular n-side polygon
_regularPolygonVertexPlacement:function a(b,c,d,e){var f=this._2PI/c;var g=f*b;// in case of two vertices, right-left placement is more estetic
if(c!==2){g-=1.6}return new L.Point(d.x+Math.cos(g)*e,d.y+Math.sin(g)*e)._round()},// clock strategy placement.
// regularFirstCicle parameter - true if first elements in the first circle are placed regularly
_generatePointsClocksCircles:function a(b,c,d){var e=[];var f=this._group.options.firstCircleElements;var g=this._circleFootSeparation*1.5,// offset of the first circle
h=this._group.options.spiderfyDistanceMultiplier,// multiplier of the offset for a next circle
j=this._group.options.spiderfyDistanceSurplus,// multiplier of the offset for a next circle
k=this._group.options.elementsMultiplier;// multiplier of number of elements in the next circle
var l=1,m=f,n=g,o=0;this._createHelpingCircle(c,n);// iterating elements
for(var p=1;p<=b;p++){var q=p-o;// position of current element in this circle
// changing the circle
if(q>m){l+=1;o+=m;q=p-o;// position of current element in this circle
m=Math.floor(m*k);n=(j+n)*h;this._createHelpingCircle(c,n)}if(d&&l===1){e[p-1]=this._regularPolygonVertexPlacement(q-1,Math.min(f,b),c,n)}else{e[p-1]=this._regularPolygonVertexPlacement(q-1,m,c,n)}}return e},// method for creating and storing helping circles for clock/concentric circles strategy
_createHelpingCircle:function a(b,c){if(this._group.options.helpingCircles){var d={radius:c};// keeping without fill if it is not defined
if(!this._group.options.clockHelpingCircleOptions.fill){this._group.options.clockHelpingCircleOptions.fillColor="none"}L.extend(d,this._group.options.clockHelpingCircleOptions);var e=new L.CircleMarker(this._group._map.layerPointToLatLng(b),d);this._group._featureGroup.addLayer(e);this._clockHelpingGeometries.push(e)}},// concentric circles strategy placement.
// divide elements of cluster into concentric zones based on elementsMultiplier and firstCircleElements parameters
_generatePointsConcentricCircles:function a(b,d){var e=this;var f=[];var g=this._group.options.firstCircleElements,h=this._circleFootSeparation*1.5,// offset of the first circle
j=this._group.options.spiderfyDistanceMultiplier,// multiplier of the offset for a next circle
c=this._group.options.elementsMultiplier,// multiplier of number of elements in the next circle
k=this._group.options.spiderfyDistanceSurplus,// multiplier of the offset for a next circle
l=Math.round(g*c);// number of elements in the second circle
var m=[{distance:h,noElements:0},{distance:(k+h)*j,noElements:0},{distance:(2*k+h)*j*j,noElements:0},{distance:(3*k+h)*j*j*j,noElements:0}];// number of points in the second circle
if(b>g){m[1].noElements=l;if(g<b&&b<2*g||g+l<b&&b<2*g+l){m[1].noElements=g}}// number of points in the third circle
if(b>g+Math.round(g*c)){m[2].noElements=Math.round(g*c)}if(b>g+2*Math.round(g*c)){m[2].noElements=Math.round(g*c*c)}if(b>g+Math.round(g*c)+Math.round(g*c*c)){m[2].noElements=Math.round(g*c)}if(b>g+2*Math.round(g*c)+Math.round(g*c*c)){m[2].noElements=Math.round(g*c*c)}// number of points in the first circle
m[0].noElements=Math.min(b-m[1].noElements-m[2].noElements,g);// number of points in the fourth circle
m[3].noElements=Math.max(b-m[0].noElements-m[1].noElements-m[2].noElements,0);var n=0;// number of elements in the finished circles
var o=m[0];// curretly driven circle
// iterating elements
for(var p=1;p<=b;p++){// changing to the new circle
if(m[1].noElements>0){if(p>m[0].noElements){o=m[1];n=m[0].noElements}if(p>m[0].noElements+m[1].noElements&&m[2].noElements>0){o=m[2];n=m[0].noElements+m[1].noElements}if(p>m[0].noElements+m[1].noElements+m[2].noElements&&m[3].noElements>0){o=m[3];n=m[0].noElements-m[1].noElements-m[2].noElements}}f[p-1]=this._regularPolygonVertexPlacement(p-n,o.noElements,d,o.distance)}m.filter(function(a){return a.noElements}).map(function(a){return e._createHelpingCircle(d,a.distance)});return f},_removeClockHelpingCircles:function a(b){for(var c in this._clockHelpingGeometries){b.removeLayer(this._clockHelpingGeometries[c])}},_getOriginalLocations:function a(b,c){var d=[];b.forEach(function(a){d.push(c.latLngToLayerPoint(a.getLatLng()))});return d}});"use strict";/*global L:true*/L.MarkerClusterGroup.include({options:{maxClusterRadius:80,//A cluster will cover at most this many pixels from its center
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
clockHelpingCircleOptions:{color:"grey",dashArray:5,fillOpacity:0,opacity:0.5,weight:3},// Set to false to disable all animations (zoom and spiderfy).
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
