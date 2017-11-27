
/*
  markerCluster placement-strategies subplugin for leaflet
  https://github.com/adammertel/Leaflet.RegularGridCluster
  Adam Mertel | univie
*/
'use strict';

L.MarkerCluster.include({
  spiderfy: function spiderfy() {
    if (this._group._spiderfied === this || this._group._inZoomAnimation) {
      return;
    }

    var childMarkers = this.getAllChildMarkers();
    var group = this._group;
    var map = group._map;
    var center = map.latLngToLayerPoint(this._latlng);
    var positions = [];

    if (!(this._group.getLayers()[0] instanceof L.CircleMarker)) {
      center.y += 10;
    }

    for (var chmi in childMarkers) {
      if (childMarkers[chmi].setStyle) {
        childMarkers[chmi].setStyle({ className: 'clustered-element' });
      }
    }

    this._group._unspiderfy();
    this._group._spiderfied = this;

    this._clockHelpingGeometries = [];

    switch (this._group.options.elementsPlacementStrategy) {
      case 'default':
        if (childMarkers.length >= this._circleSpiralSwitchover) {
          positions = this._generatePointsSpiral(childMarkers.length, center);
        } else {
          positions = this._generatePointsCircle(childMarkers.length, center);
        }
        break;

      case 'spiral':
        positions = this._generatePointsSpiral(childMarkers.length, center);
        break;

      case 'one-circle':
        positions = this._generatePointsCircle(childMarkers.length, center);
        break;

      case 'concentric':
        positions = this._generatePointsConcentricCircles(childMarkers.length, center);
        break;

      case 'clock':
        positions = this._generatePointsClocksCircles(childMarkers.length, center, false);
        break;

      case 'clock-concentric':
        positions = this._generatePointsClocksCircles(childMarkers.length, center, true);
        break;

      case 'original-locations':
        positions = this._getOriginalLocations(childMarkers, this._group._map);
        break;

      default:
        console.log('!!unknown placement strategy value. Allowed strategy names are : "default", "spiral", "one-circle", "concentric", "clock" and "clock-concentric" ');
    }

    this._animationSpiderfy(childMarkers, positions);
  },

  unspiderfy: function unspiderfy(zoomDetails) {
    if (this._group._inZoomAnimation) {
      return;
    }
    this._animationUnspiderfy(zoomDetails);

    if (this._group.options.helpingCircles) {
      this._removeClockHelpingCircles(this._group._featureGroup);
    }

    this._group._spiderfied = null;
  },

  _generatePointsCircle: function _generatePointsCircle(count, centerPt) {
    var circumference = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + count),
        legLength = circumference / this._2PI,
        angleStep = this._2PI / count,
        res = [];

    var i = void 0,
        angle = void 0;

    res.length = count;

    for (i = count - 1; i >= 0; i--) {
      angle = this._circleStartAngle + i * angleStep;
      res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
    }

    return res;
  },

  _generatePointsSpiral: function _generatePointsSpiral(count, centerPt) {
    var spiderfyDistanceMultiplier = this._group.options.spiderfyDistanceMultiplier,
        separation = spiderfyDistanceMultiplier * this._spiralFootSeparation,
        lengthFactor = spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI,
        res = [];
    var i = void 0,
        angle = 0;
    var legLength = spiderfyDistanceMultiplier * this._spiralLengthStart;

    res.length = count;

    for (i = count - 1; i >= 0; i--) {
      angle += separation / legLength + i * 0.0005;
      res[i] = new L.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle))._round();
      legLength += lengthFactor / angle;
    }
    return res;
  },

  _regularPolygonVertexPlacement: function _regularPolygonVertexPlacement(vertexNo, totalVertices, centerPt, distanceFromCenter) {
    var deltaAngle = this._2PI / totalVertices;
    var thisAngle = deltaAngle * vertexNo;

    if (totalVertices !== 2) {
      thisAngle -= 1.6;
    }

    return new L.Point(centerPt.x + Math.cos(thisAngle) * distanceFromCenter, centerPt.y + Math.sin(thisAngle) * distanceFromCenter)._round();
  },

  _generatePointsClocksCircles: function _generatePointsClocksCircles(count, centerPt, regularFirstCircle) {
    var res = [];
    var fce = this._group.options.firstCircleElements;

    var baseDistance = this._circleFootSeparation * 1.5,
        dm = this._group.options.spiderfyDistanceMultiplier,
        distanceSurplus = this._group.options.spiderfyDistanceSurplus,
        elementsMultiplier = this._group.options.elementsMultiplier;

    var iCircleNumber = 1,
        iCircleNoElements = fce,
        iCircleDistance = baseDistance,
        elementsInPreviousCircles = 0;

    this._createHelpingCircle(centerPt, iCircleDistance);

    for (var i = 1; i <= count; i++) {
      var elementOrder = i - elementsInPreviousCircles;
      if (elementOrder > iCircleNoElements) {
        iCircleNumber += 1;
        elementsInPreviousCircles += iCircleNoElements;
        elementOrder = i - elementsInPreviousCircles;

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

  _createHelpingCircle: function _createHelpingCircle(center, radius) {
    if (this._group.options.helpingCircles) {
      var clockCircleStyle = { radius: radius };

      if (!this._group.options.clockHelpingCircleOptions.fill) {
        this._group.options.clockHelpingCircleOptions.fillColor = 'none';
      }
      console.log(this._group.options.clockHelpingCircleOptions);
      L.extend(clockCircleStyle, this._group.options.clockHelpingCircleOptions);

      var clockCircle = new L.CircleMarker(this._group._map.layerPointToLatLng(center), clockCircleStyle);
      this._group._featureGroup.addLayer(clockCircle);
      this._clockHelpingGeometries.push(clockCircle);
    }
  },

  _generatePointsConcentricCircles: function _generatePointsConcentricCircles(count, centerPt) {
    var _this = this;

    var res = [];

    var fce = this._group.options.firstCircleElements,
        baseDistance = this._circleFootSeparation * 1.5,
        dm = this._group.options.spiderfyDistanceMultiplier,
        elementsMultiplier = this._group.options.elementsMultiplier,
        distanceSurplus = this._group.options.spiderfyDistanceSurplus,
        secondCircleElements = Math.round(fce * elementsMultiplier);

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
    }];

    if (count > fce) {
      circles[1].noElements = secondCircleElements;

      if (fce < count && count < 2 * fce || fce + secondCircleElements < count && count < 2 * fce + secondCircleElements) {
        circles[1].noElements = fce;
      }
    }

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
    }

    circles[0].noElements = Math.min(count - circles[1].noElements - circles[2].noElements, fce);

    circles[3].noElements = Math.max(count - circles[0].noElements - circles[1].noElements - circles[2].noElements, 0);

    var prevCirclesEls = 0;
    var iCircle = circles[0];
    for (var i = 1; i <= count; i++) {
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
    for (var hg in this._clockHelpingGeometries) {
      fg.removeLayer(this._clockHelpingGeometries[hg]);
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
'use strict';

L.MarkerClusterGroup.include({
  options: {
    maxClusterRadius: 80,
    iconCreateFunction: null,
    clusterPane: L.Marker.prototype.options.pane,

    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    singleMarkerMode: false,

    disableClusteringAtZoom: null,

    removeOutsideVisibleBounds: true,

    elementsPlacementStrategy: 'clock-concentric',

    firstCircleElements: 10,

    elementsMultiplier: 1.5,

    spiderfyDistanceSurplus: 30,

    helpingCircles: true,

    clockHelpingCircleOptions: {
      color: 'grey',
      dashArray: 5,
      fillOpacity: 0,
      opacity: 0.5,
      weight: 3
    },

    animate: false,

    animateAddingMarkers: false,

    spiderfyDistanceMultiplier: 1,

    spiderLegPolylineOptions: { weight: 1.5, color: '#222', opacity: 0.5 },

    chunkedLoading: false,
    chunkInterval: 200,
    chunkDelay: 50,
    chunkProgress: null,
    polygonOptions: {}
  }
});
