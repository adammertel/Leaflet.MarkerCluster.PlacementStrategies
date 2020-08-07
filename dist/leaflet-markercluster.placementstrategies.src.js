
/*
  markerCluster placement-strategies subplugin for leaflet.markercluster
  https://github.com/adammertel/Leaflet.MarkerCluster.PlacementStrategies
  Adam Mertel | univie
*/
"use strict";

/*global L:true*/
L.MarkerClusterGroup.include({
  _noanimationUnspiderfy: function _noanimationUnspiderfy() {
    if (this._spiderfied) {
      //this._spiderfied._noanimationUnspiderfy();
      this._spiderfied.unspiderfy();
    }
  }
});
L.MarkerCluster.include({
  spiderfy: function spiderfy() {
    var group = this._group;
    var options = group.options;

    if (group._spiderfied === this || group._inZoomAnimation) {
      return;
    }

    var childMarkers = this.getAllChildMarkers();
    var map = group._map;
    var center = map.latLngToLayerPoint(this._latlng);
    var positions = []; // add options.spiderfiedClassName to the spiderfied markers

    if (options.spiderfiedClassName) {
      for (var chmi in childMarkers) {
        var marker = childMarkers[chmi]; // marker

        if (marker.getIcon) {
          var icon = marker.getIcon();

          if (icon) {
            if (icon.options.className) {
              if (!icon.options.className.includes(options.spiderfiedClassName)) {
                icon.options.className += " " + options.spiderfiedClassName;
              }
            } else {
              icon.options.className = options.spiderfiedClassName;
            }
          } //circleMarker

        } else if (childMarkers[chmi].setStyle) {
          var classNames = childMarkers[chmi].options.className;
          childMarkers[chmi].setStyle({
            className: classNames + " " + options.spiderfiedClassName
          });
        }
      }
    }

    group._unspiderfy();

    group._spiderfied = this;
    this._clockHelpingGeometries = []; // TODO Maybe: childMarkers order by distance to center
    // applies chosen placement strategy

    switch (options.elementsPlacementStrategy) {
      case "default":
        if (childMarkers.length >= this._circleSpiralSwitchover) {
          positions = this._generatePointsSpiral(childMarkers.length, center);
        } else {
          positions = this._generatePointsCircle(childMarkers.length, center);
        }

        break;

      case "spiral":
        positions = this._generatePointsSpiral(childMarkers.length, center);
        break;

      case "one-circle":
        positions = this._generatePointsCircle(childMarkers.length, center);
        break;

      case "concentric":
        positions = this._generatePointsConcentricCircles(childMarkers.length, center);
        break;

      case "clock":
        positions = this._generatePointsClocksCircles(childMarkers.length, center, false);
        break;

      case "clock-concentric":
        positions = this._generatePointsClocksCircles(childMarkers.length, center, true);
        break;

      case "original-locations":
        positions = this._getOriginalLocations(childMarkers, group._map);
        break;

      default:
        console.log('!!unknown placement strategy value. Allowed strategy names are : "default", "spiral", "one-circle", "concentric", "clock", "clock-concentric" and "original-locations" ');
    }

    this._animationSpiderfy(childMarkers, positions);
  },
  unspiderfy: function unspiderfy(zoomDetails) {
    // remove _supportiveGeometries from map
    this._removeClockHelpingCircles(); /// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>


    if (this._group._inZoomAnimation) {
      return;
    }

    this._animationUnspiderfy(zoomDetails);

    this._group._spiderfied = null;
  },
  _generatePointsCircle: function _generatePointsCircle(count, centerPt) {
    var circumference = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count),
        legLength = circumference / this._2PI,
        //radius from circumference
    angleStep = this._2PI / count,
        res = [];
    var i, angle;
    res.length = count;

    for (i = count - 1; i >= 0; i--) {
      angle = this._circleStartAngle + i * angleStep;
      res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
    }

    this._createHelpingCircle(centerPt, legLength);

    return res;
  },
  _generatePointsSpiral: function _generatePointsSpiral(count, centerPt) {
    var spiderfyDistanceMultiplier = this._group.options.spiderfyDistanceMultiplier,
        separation = spiderfyDistanceMultiplier * this._spiralFootSeparation,
        lengthFactor = spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI,
        res = [];
    var i,
        angle = 0;
    var legLength = spiderfyDistanceMultiplier * this._spiralLengthStart;
    res.length = count; // Higher index, closer position to cluster center.

    for (i = count - 1; i >= 0; i--) {
      angle += separation / legLength + i * 0.0005;
      res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
      legLength += lengthFactor / angle;
    }

    return res;
  },
  // auxiliary method - returns placement of vertex of given regular n-side polygon
  _regularPolygonVertexPlacement: function _regularPolygonVertexPlacement(vertexNo, totalVertices, centerPt, distanceFromCenter) {
    var deltaAngle = this._2PI / totalVertices;
    var thisAngle = deltaAngle * vertexNo; // in case of two vertices, right-left placement is more estetic

    if (totalVertices !== 2) {
      thisAngle -= 1.6;
    }

    return new L.Point(centerPt.x + Math.cos(thisAngle) * distanceFromCenter, centerPt.y + Math.sin(thisAngle) * distanceFromCenter)._round();
  },
  // clock strategy placement.
  // regularFirstCicle parameter - true if first elements in the first circle are placed regularly
  _generatePointsClocksCircles: function _generatePointsClocksCircles(count, centerPt, regularFirstCircle) {
    var res = [];
    var options = this._group.options;
    var fce = options.firstCircleElements;
    var baseDistance = this._circleFootSeparation * 1.5,
        // offset of the first circle
    dm = options.spiderfyDistanceMultiplier,
        // multiplier of the offset for a next circle
    distanceSurplus = options.spiderfyDistanceSurplus,
        // multiplier of the offset for a next circle
    elementsMultiplier = options.elementsMultiplier; // multiplier of number of elements in the next circle

    var iCircleNumber = 1,
        iCircleNoElements = fce,
        iCircleDistance = baseDistance,
        elementsInPreviousCircles = 0;

    this._createHelpingCircle(centerPt, iCircleDistance); // iterating elements


    for (var i = 1; i <= count; i++) {
      var elementOrder = i - elementsInPreviousCircles; // position of current element in this circle
      // changing the circle

      if (elementOrder > iCircleNoElements) {
        iCircleNumber += 1;
        elementsInPreviousCircles += iCircleNoElements;
        elementOrder = i - elementsInPreviousCircles; // position of current element in this circle

        iCircleNoElements = Math.floor(iCircleNoElements * elementsMultiplier);
        iCircleDistance = (distanceSurplus + iCircleDistance) * dm;

        this._createHelpingCircle(centerPt, iCircleDistance);
      }

      if (regularFirstCircle && iCircleNumber === 1) {
        res[i - 1] = this._regularPolygonVertexPlacement(elementOrder - 1, Math.min(fce, count), centerPt, iCircleDistance);
      } else {
        res[i - 1] = this._regularPolygonVertexPlacement(elementOrder - 1, iCircleNoElements, centerPt, iCircleDistance);
      }
    }

    return res;
  },
  // method for creating and storing helping circles for clock/concentric circles strategy
  _createHelpingCircle: function _createHelpingCircle(center, radius) {
    var group = this._group;
    var options = group.options;

    if (options.helpingCircles) {
      var clockCircleStyle = {
        radius: radius
      }; // keeping without fill if it is not defined

      if (!options.clockHelpingCircleOptions.fill) {
        options.clockHelpingCircleOptions.fillColor = "none";
      }

      L.extend(clockCircleStyle, options.clockHelpingCircleOptions);
      var clockCircle = new L.CircleMarker(group._map.layerPointToLatLng(center), clockCircleStyle);

      group._featureGroup.addLayer(clockCircle);

      this._clockHelpingGeometries.push(clockCircle);
    }
  },
  // concentric circles strategy placement.
  // divide elements of cluster into concentric zones based on elementsMultiplier and firstCircleElements parameters
  _generatePointsConcentricCircles: function _generatePointsConcentricCircles(count, centerPt) {
    var _this = this;

    var options = this._group.options;
    var res = [];
    var fce = options.firstCircleElements,
        baseDistance = this._circleFootSeparation * 1.5,
        // offset of the first circle
    dm = options.spiderfyDistanceMultiplier,
        // multiplier of the offset for a next circle
    elementsMultiplier = options.elementsMultiplier,
        // multiplier of number of elements in the next circle
    distanceSurplus = options.spiderfyDistanceSurplus,
        // multiplier of the offset for a next circle
    secondCircleElements = Math.round(fce * elementsMultiplier); // number of elements in the second circle

    var circles = [{
      distance: baseDistance,
      noElements: 0
    }, {
      distance: (distanceSurplus + baseDistance) * dm,
      noElements: 0
    }, {
      distance: (2 * distanceSurplus + baseDistance) * dm * dm,
      noElements: 0
    }, {
      distance: (3 * distanceSurplus + baseDistance) * dm * dm * dm,
      noElements: 0
    }]; // number of points in the second circle

    if (count > fce) {
      circles[1].noElements = secondCircleElements;

      if (fce < count && count < 2 * fce || fce + secondCircleElements < count && count < 2 * fce + secondCircleElements) {
        circles[1].noElements = fce;
      }
    } // number of points in the third circle


    if (count > fce + Math.round(fce * elementsMultiplier)) {
      circles[2].noElements = Math.round(fce * elementsMultiplier);
    }

    if (count > fce + 2 * Math.round(fce * elementsMultiplier)) {
      circles[2].noElements = Math.round(fce * elementsMultiplier * elementsMultiplier);
    }

    if (count > fce + Math.round(fce * elementsMultiplier) + Math.round(fce * elementsMultiplier * elementsMultiplier)) {
      circles[2].noElements = Math.round(fce * elementsMultiplier);
    }

    if (count > fce + 2 * Math.round(fce * elementsMultiplier) + Math.round(fce * elementsMultiplier * elementsMultiplier)) {
      circles[2].noElements = Math.round(fce * elementsMultiplier * elementsMultiplier);
    } // number of points in the first circle


    circles[0].noElements = Math.min(count - circles[1].noElements - circles[2].noElements, fce); // number of points in the fourth circle

    circles[3].noElements = Math.max(count - circles[0].noElements - circles[1].noElements - circles[2].noElements, 0);
    var prevCirclesEls = 0; // number of elements in the finished circles

    var iCircle = circles[0]; // curretly driven circle
    // iterating elements

    for (var i = 1; i <= count; i++) {
      // changing to the new circle
      if (circles[1].noElements > 0) {
        if (i > circles[0].noElements) {
          iCircle = circles[1];
          prevCirclesEls = circles[0].noElements;
        }

        if (i > circles[0].noElements + circles[1].noElements && circles[2].noElements > 0) {
          iCircle = circles[2];
          prevCirclesEls = circles[0].noElements + circles[1].noElements;
        }

        if (i > circles[0].noElements + circles[1].noElements + circles[2].noElements && circles[3].noElements > 0) {
          iCircle = circles[3];
          prevCirclesEls = circles[0].noElements - circles[1].noElements - circles[2].noElements;
        }
      }

      res[i - 1] = this._regularPolygonVertexPlacement(i - prevCirclesEls, iCircle.noElements, centerPt, iCircle.distance);
    }

    circles.filter(function (c) {
      return c.noElements;
    }).map(function (c) {
      return _this._createHelpingCircle(centerPt, c.distance);
    });
    return res;
  },
  _removeClockHelpingCircles: function _removeClockHelpingCircles(fg) {
    if (this._group.options.helpingCircles) {
      for (var hg in this._clockHelpingGeometries) {
        var featureGroup = this._group._featureGroup;
        featureGroup.removeLayer(this._clockHelpingGeometries[hg]);
      }
    }
  },
  _getOriginalLocations: function _getOriginalLocations(childMarkers, map) {
    var res = [];
    childMarkers.forEach(function (marker) {
      res.push(map.latLngToLayerPoint(marker.getLatLng()));
    });
    return res;
  }
});
"use strict";

/*global L:true*/
L.MarkerClusterGroup.include({
  options: {
    maxClusterRadius: 80,
    //A cluster will cover at most this many pixels from its center
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
    spiderLegPolylineOptions: {
      weight: 1.5,
      color: "#222",
      opacity: 0.5
    },
    // When bulk adding layers, adds markers in chunks. Means addLayers may not add all the layers in the call, others will be loaded during setTimeouts
    chunkedLoading: false,
    chunkInterval: 200,
    // process markers for a maximum of ~ n milliseconds (then trigger the chunkProgress callback)
    chunkDelay: 50,
    // at the end of each interval, give n milliseconds back to system/browser
    chunkProgress: null,
    // progress callback: function(processed, total, elapsed) (e.g. for a progress indicator)
    // Options to pass to the L.Polygon constructor
    polygonOptions: {}
  }
});
