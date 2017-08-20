function App() {
  this.map = L.map('map');
  this.api = new wikibase.queryService.api.Sparql();
  this.formatterHelper = new wikibase.queryService.ui.resultBrowser.helper.FormatterHelper();
}

App.prototype.boot = function () {
  this.osmLayer = this._createOSMLayer();
  this.wikidataLayer = this._createGeoJSONLayer();

  this.map.addLayer(this.osmLayer);
  this.map.addLayer(this.wikidataLayer);

  this.map.setView([-2, 120], 5);

  this._registerEvents();
}

App.prototype._createOSMLayer = function (minZoom, maxZoom) {
  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib = '© <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

  var osm = new L.TileLayer(osmUrl, {
    minZoom: minZoom || 5,
    maxZoom: maxZoom || 15,
    attribution: osmAttrib
  });

  return osm;
}

App.prototype._createGeoJSONLayer = function (geojson) {
  return L.geoJSON(geojson || [], {
    onEachFeature: function (feature, layer) {
      layer.bindPopup(feature.properties.popupContent);
    }
  });
}

App.prototype._getQueryFilepath = function (selector) {
  return $(selector).attr('c-query-filepath');
}

App.prototype._resetNotifications = function () {
  return $('#c-notif-holder').empty();
}

App.prototype._showLoading = function (selector) {
  return $(selector).after('<i id="current-loading" class="fa fa-spinner fa-pulse fa-fw"></i>');
}

App.prototype._makeCollections = function (data) {
  var self = this;
  var collections = [];

  data.results.bindings.map(function (result) {
    Object.keys(result).map(function (key) {
      var feature = wellknown.parse(result[key].value);

      if (feature) {
        feature.properties = feature.properties || {};
        feature.properties.popupContent = self._popupTemplate(result);
        collections.push(feature);
      }
    });
  });

  return collections;
}

App.prototype._addToTable = function (data) {
  data.results.bindings.forEach(function (item) {
    $('#c-data-table-content').append(
      '<div class="media">'
      + '<div class="media-content">'
      + '<p class="title is-6">'
      + '<a href="'
      + item.item.value
      + '" target="_blank">'
      + item.itemLabel.value
      + '</a>'
      + '</p>'
      + '</div>'
      + '</div>'
    );
  });
}

App.prototype._notifyResultStatus = function (data, collections) {
  $('#c-notif-holder').append(
    '<div class="notification is-info"><button class="delete" onclick="$(this).parent().remove()"></button>'
    + data.results.bindings.length + ' found<br>'
    + collections.length + ' has location defined on map'
    + '</div>'
  );
}

App.prototype._removeLoading = function () {
  return $('#current-loading').remove();
}

App.prototype._popupTemplate = function (originalRow) {
  var self = this;
  var template = $('<div/>');

  var row = Object.assign({}, originalRow);

  Object.keys(row).map(function (key) {
    if (row[key+'Label']) {
      row[key].label = row[key+'Label'].value;
    }
  });

  Object.keys(row).map(function (key) {
    if (key.endsWith('Label')) {
      delete row[key];
    }
  });

  Object.keys(row).map(function (key) {
    template.append($('<div>').html('<b>'+key+'</b>: ').append(self.formatterHelper.formatValue(row[key], key, true)));
  });

  return template.html();
}

App.prototype._query = function (query) {
  var self = this;
  self._resetNotifications();

  self.api.query(query).done(function () {
    var data = self.api.getResultRawData();
    var collections = self._makeCollections(data);

    self.wikidataLayer.clearLayers();
    self.wikidataLayer.addData(collections);

    self._removeLoading();
    self._notifyResultStatus(data, collections);
    self._addToTable(data);
  });
}

App.prototype._registerEvents = function () {
  var self = this;

  // show menu
  $('#c-button-menu').click(function () {
    $('#c-panel-menu').css('display', 'block');
  });

  // close menu
  $('#c-button-menu-close').click(function () {
    $('#c-panel-menu').css('display', 'none');
  });

  // back to menu from data
   $('#c-button-data-back').click(function () {
     $('#c-data-table').css('display', 'none');
   })

  // query link
  $('a[c-query-filepath]').click(function () {
    $('#c-data-table-content').empty();
    self._showLoading(this);
    var path = self._getQueryFilepath(this);

    $.get(path, function (res) {
      self._query(res);
    });

    $('#c-path-name').empty();
    $('#c-path-name').append($(this).attr('c-query-file'));

    $('#c-data-table').css('display', 'block');
  });
}
