import 'ol/ol.css';
import 'javascript-autocomplete/auto-complete.css';
import proj from 'ol/proj';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';
import { apply } from 'ol-mapbox-style';
import AutoComplete from 'javascript-autocomplete';
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import Stamen from 'ol/source/stamen';
import Vector from 'ol/source/vector';
import Style from 'ol/style/style';
import IconStyle from 'ol/style/icon';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';

const map = new Map({
  target: 'map',
  view: new View({
    center: proj.fromLonLat([16.37, 48.2]),
    zoom: 11
  })
});

map.addLayer(new TileLayer({
  source: new Stamen({
    layer: 'toner'
  })
}));


const layer = new VectorLayer({
  source: new Vector({
    url: 'https://student.ifip.tuwien.ac.at/geoweb/2017/g06/karte/swf_postgis_geojson.php',
    format: new GeoJSON()
  })
});
map.addLayer(layer);

layer.setStyle(function(feature) {
  var properties = feature.getProperties ()
  //if properties.typ == "fussball"
  return new Style({
    text: new Text({
      text: feature.get('name'),
      font: 'Bold 14pt Verdana',
      stroke: new Stroke({
      color: 'white',
      width: 3
      })
    }),
    image: new IconStyle({
      src: './data/marker3.png'
    })
  });
  //else if...
});

function fit() {
  map.getView().fit(source.getExtent(), {
    maxZoom: 15,
    duration: 250
  });
}

var selected;
function getAddress(feature) {
  var properties = feature.getProperties();
  return (
    (properties.city || properties.name || "") +
    " " +
    (properties.street || "") +
    " " +
    (properties.housenumber || "")
  );
}

var searchResult = new VectorLayer({
  zIndex: 9999
});

searchResult.setStyle(new Style({
  image: new IconStyle({
    src: './data/marker3.png'
  })
}));

map.addLayer(searchResult);

var onload, source;
new AutoComplete({
  selector: 'input[name="q"]',
  source: function(term, response) {
    if (onload) {
      source.un("change", onload);
    }
    searchResult.setSource(null);
    source = new VectorSource({
      format: new GeoJSON(),
      url: "https://photon.komoot.de/api/?q=" + term
    });
    onload = function(e) {
      var texts = source.getFeatures().map(function(feature) {
        return getAddress(feature);
      });
      response(texts);
      fit();
    };
    source.once("change", onload);
    searchResult.setSource(source);
  },
  onSelect: function(e, term, item) {
    selected = item.getAttribute("data-val");
    source.getFeatures().forEach(function(feature) {
      if (getAddress(feature) !== selected) {
        source.removeFeature(feature);
      }
    });
    fit();
  }
});
map.on('singleclick', function(e) {
  var pos = proj.toLonLat(e.coordinate);
  window.location.href =
'https://student.ifip.tuwien.ac.at/geoweb/2017/g06/karte/swf_form.php?pos=' +
pos.join(' ');
});
