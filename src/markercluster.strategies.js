/*global L:true*/

L.MarkerClusterGroup.include({
  _noanimationUnspiderfy: function () {
    if (this._spiderfied) {
      //this._spiderfied._noanimationUnspiderfy();
      this._spiderfied.unspiderfy();
    }
  },
});

L.MarkerCluster.include({
  spiderfy: function () {
    const group = this._group;
    const options = group.options;

    if (group._spiderfied === this || group._inZoomAnimation) {
      return;
    }

    const childMarkers = this.getAllChildMarkers();
    const map = group._map;
    const center = map.latLngToLayerPoint(this._latlng);
    let positions = [];

    // add options.spiderfiedClassName to the spiderfied markers
    if (options.spiderfiedClassName) {
      for (var chmi in childMarkers) {
        const marker = childMarkers[chmi];

        // marker
        if (marker.getIcon) {
          const icon = marker.getIcon();
          if (icon) {
            if (icon.options.className) {
              if (
                !icon.options.className.includes(options.spiderfiedClassName)
              ) {
                icon.options.className += " " + options.spiderfiedClassName;
              }
            } else {
              icon.options.className = options.spiderfiedClassName;
            }
          }

          //circleMarker
        } else if (childMarkers[chmi].setStyle) {
          const classNames = childMarkers[chmi].options.className;
          childMarkers[chmi].setStyle({
            className: classNames + " " + options.spiderfiedClassName,
          });
        }
      }
    }

    group._unspiderfy();
    group._spiderfied = this;

    this._clockHelpingGeometries = [];

    // TODO Maybe: childMarkers order by distance to center

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
        positions = this._generatePointsConcentricCircles(
          childMarkers.length,
          center
        );
        break;

      case "clock":
        positions = this._generatePointsClocksCircles(
          childMarkers.length,
          center,
          false
        );
        break;

      case "clock-concentric":
        positions = this._generatePointsClocksCircles(
          childMarkers.length,
          center,
          true
        );
        break;

      case "original-locations":
        positions = this._getOriginalLocations(childMarkers, group._map);
        break;

      default:
        console.log(
          '!!unknown placement strategy value. Allowed strategy names are : "default", "spiral", "one-circle", "concentric", "clock", "clock-concentric" and "original-locations" '
        );
    }

    this._animationSpiderfy(childMarkers, positions);
  },

  unspiderfy: function (zoomDetails) {
    // remove _supportiveGeometries from map
    this._removeClockHelpingCircles();

    /// <param Name="zoomDetails">Argument from zoomanim if being called in a zoom animation or null otherwise</param>
    if (this._group._inZoomAnimation) {
      return;
    }
    this._animationUnspiderfy(zoomDetails);

    this._group._spiderfied = null;
  },

  _generatePointsCircle: function (count, centerPt) {
    const circumference =
        this._group.options.spiderfyDistanceMultiplier *
        this._circleFootSeparation *
        (2 + count),
      legLength = circumference / this._2PI, //radius from circumference
      angleStep = this._2PI / count,
      res = [];

    let i, angle;

    res.length = count;

    for (i = count - 1; i >= 0; i--) {
      angle = this._circleStartAngle + i * angleStep;
      res[i] = new L.Point(
        centerPt.x + legLength * Math.cos(angle),
        centerPt.y + legLength * Math.sin(angle)
      )._round();
    }

    this._createHelpingCircle(centerPt, legLength);

    return res;
  },

  _generatePointsSpiral: function (count, centerPt) {
    const spiderfyDistanceMultiplier = this._group.options
        .spiderfyDistanceMultiplier,
      separation = spiderfyDistanceMultiplier * this._spiralFootSeparation,
      lengthFactor =
        spiderfyDistanceMultiplier * this._spiralLengthFactor * this._2PI,
      res = [];
    let i,
      angle = 0;
    let legLength = spiderfyDistanceMultiplier * this._spiralLengthStart;

    res.length = count;

    // Higher index, closer position to cluster center.
    for (i = count - 1; i >= 0; i--) {
      angle += separation / legLength + i * 0.0005;
      res[i] = new L.Point(
        centerPt.x + legLength * Math.cos(angle),
        centerPt.y + legLength * Math.sin(angle)
      )._round();
      legLength += lengthFactor / angle;
    }
    return res;
  },

  // auxiliary method - returns placement of vertex of given regular n-side polygon
  _regularPolygonVertexPlacement: function (
    vertexNo,
    totalVertices,
    centerPt,
    distanceFromCenter
  ) {
    const deltaAngle = this._2PI / totalVertices;
    let thisAngle = deltaAngle * vertexNo;

    // in case of two vertices, right-left placement is more estetic
    if (totalVertices !== 2) {
      thisAngle -= 1.6;
    }

    return new L.Point(
      centerPt.x + Math.cos(thisAngle) * distanceFromCenter,
      centerPt.y + Math.sin(thisAngle) * distanceFromCenter
    )._round();
  },

  // clock strategy placement.
  // regularFirstCicle parameter - true if first elements in the first circle are placed regularly
  _generatePointsClocksCircles: function (count, centerPt, regularFirstCircle) {
    const res = [];
    const options = this._group.options;
    const fce = options.firstCircleElements;

    const baseDistance = this._circleFootSeparation * 1.5, // offset of the first circle
      dm = options.spiderfyDistanceMultiplier, // multiplier of the offset for a next circle
      distanceSurplus = options.spiderfyDistanceSurplus, // multiplier of the offset for a next circle
      elementsMultiplier = options.elementsMultiplier; // multiplier of number of elements in the next circle

    let iCircleNumber = 1,
      iCircleNoElements = fce,
      iCircleDistance = baseDistance,
      elementsInPreviousCircles = 0;

    this._createHelpingCircle(centerPt, iCircleDistance);

    // iterating elements
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
        res[i - 1] = this._regularPolygonVertexPlacement(
          elementOrder - 1,
          Math.min(fce, count),
          centerPt,
          iCircleDistance
        );
      } else {
        res[i - 1] = this._regularPolygonVertexPlacement(
          elementOrder - 1,
          iCircleNoElements,
          centerPt,
          iCircleDistance
        );
      }
    }

    return res;
  },

  // method for creating and storing helping circles for clock/concentric circles strategy
  _createHelpingCircle: function (center, radius) {
    const group = this._group;
    const options = group.options;

    if (options.helpingCircles) {
      const clockCircleStyle = { radius: radius };

      // keeping without fill if it is not defined
      if (!options.clockHelpingCircleOptions.fill) {
        options.clockHelpingCircleOptions.fillColor = "none";
      }
      L.extend(clockCircleStyle, options.clockHelpingCircleOptions);

      const clockCircle = new L.CircleMarker(
        group._map.layerPointToLatLng(center),
        clockCircleStyle
      );
      group._featureGroup.addLayer(clockCircle);
      this._clockHelpingGeometries.push(clockCircle);
    }
  },

  // concentric circles strategy placement.
  // divide elements of cluster into concentric zones based on elementsMultiplier and firstCircleElements parameters
  _generatePointsConcentricCircles: function (count, centerPt) {
    const options = this._group.options;
    const res = [];

    const fce = options.firstCircleElements,
      baseDistance = this._circleFootSeparation * 1.5, // offset of the first circle
      dm = options.spiderfyDistanceMultiplier, // multiplier of the offset for a next circle
      elementsMultiplier = options.elementsMultiplier, // multiplier of number of elements in the next circle
      distanceSurplus = options.spiderfyDistanceSurplus, // multiplier of the offset for a next circle
      secondCircleElements = Math.round(fce * elementsMultiplier); // number of elements in the second circle

    var circles = [
      {
        distance: baseDistance,
        noElements: 0,
      },
      {
        distance: (distanceSurplus + baseDistance) * dm,
        noElements: 0,
      },
      {
        distance: (2 * distanceSurplus + baseDistance) * dm * dm,
        noElements: 0,
      },
      {
        distance: (3 * distanceSurplus + baseDistance) * dm * dm * dm,
        noElements: 0,
      },
    ];

    // number of points in the second circle
    if (count > fce) {
      circles[1].noElements = secondCircleElements;

      if (
        (fce < count && count < 2 * fce) ||
        (fce + secondCircleElements < count &&
          count < 2 * fce + secondCircleElements)
      ) {
        circles[1].noElements = fce;
      }
    }

    // number of points in the third circle
    if (count > fce + Math.round(fce * elementsMultiplier)) {
      circles[2].noElements = Math.round(fce * elementsMultiplier);
    }
    if (count > fce + 2 * Math.round(fce * elementsMultiplier)) {
      circles[2].noElements = Math.round(
        fce * elementsMultiplier * elementsMultiplier
      );
    }
    if (
      count >
      fce +
        Math.round(fce * elementsMultiplier) +
        Math.round(fce * elementsMultiplier * elementsMultiplier)
    ) {
      circles[2].noElements = Math.round(fce * elementsMultiplier);
    }
    if (
      count >
      fce +
        2 * Math.round(fce * elementsMultiplier) +
        Math.round(fce * elementsMultiplier * elementsMultiplier)
    ) {
      circles[2].noElements = Math.round(
        fce * elementsMultiplier * elementsMultiplier
      );
    }

    // number of points in the first circle
    circles[0].noElements = Math.min(
      count - circles[1].noElements - circles[2].noElements,
      fce
    );

    // number of points in the fourth circle
    circles[3].noElements = Math.max(
      count -
        circles[0].noElements -
        circles[1].noElements -
        circles[2].noElements,
      0
    );

    let prevCirclesEls = 0; // number of elements in the finished circles
    let iCircle = circles[0]; // curretly driven circle

    // iterating elements
    for (var i = 1; i <= count; i++) {
      // changing to the new circle
      if (circles[1].noElements > 0) {
        if (i > circles[0].noElements) {
          iCircle = circles[1];
          prevCirclesEls = circles[0].noElements;
        }
        if (
          i > circles[0].noElements + circles[1].noElements &&
          circles[2].noElements > 0
        ) {
          iCircle = circles[2];
          prevCirclesEls = circles[0].noElements + circles[1].noElements;
        }
        if (
          i >
            circles[0].noElements +
              circles[1].noElements +
              circles[2].noElements &&
          circles[3].noElements > 0
        ) {
          iCircle = circles[3];
          prevCirclesEls =
            circles[0].noElements -
            circles[1].noElements -
            circles[2].noElements;
        }
      }

      res[i - 1] = this._regularPolygonVertexPlacement(
        i - prevCirclesEls,
        iCircle.noElements,
        centerPt,
        iCircle.distance
      );
    }

    circles
      .filter((c) => c.noElements)
      .map((c) => this._createHelpingCircle(centerPt, c.distance));

    return res;
  },

  _removeClockHelpingCircles: function (fg) {
    if (this._group.options.helpingCircles) {
      for (var hg in this._clockHelpingGeometries) {
        const featureGroup = this._group._featureGroup;
        featureGroup.removeLayer(this._clockHelpingGeometries[hg]);
      }
    }
  },

  _getOriginalLocations: function (childMarkers, map) {
    var res = [];

    childMarkers.forEach(function (marker) {
      res.push(map.latLngToLayerPoint(marker.getLatLng()));
    });

    return res;
  },
});
