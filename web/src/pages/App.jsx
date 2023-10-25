import axios from "axios";
import pako from "pako";
import StaticMap, { Source, Layer, NavigationControl, ScaleControl } from "react-map-gl";
import React, { useRef, useState, useEffect } from "react";
import DeckGL, { ArcLayer } from "deck.gl";

import { MapContext } from "react-map-gl/dist/esm/components/map.js";

import OptionsPanel from "../components/OptionsPanel.jsx";
import DashboardPanel from "../components/DashboardPanel.jsx";
import AboutPanel from "../components/AboutPanel.jsx";
import DetailPoint from "../components/DetailPoint.jsx";
import { calculateSignalIndex } from "../utils/utils.js";
import { layoutAntena, paintSchool, paintHeatmap, paintPolygonSignal } from "../utils/styles_map.js";
import { MAX_ZOOM_HEADMAP, MIN_ZOOM_HEADMAP, MIN_ZOOM_SCHOOL, MIN_ZOOM_SIGNAL } from "../utils/constants.js";

const API_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const GEOJSON_URL = process.env.REACT_APP_GEOJSON_URL;
const LAYERS_ACTION = ["schools-layer", "antenas-layer"];

const initialViewState = {
  latitude: -13.53774,
  longitude: -74.12402,
  zoom: 8,
  pitch: 25,
  bearing: 15,
  maxPitch: 89,
};

const App = () => {
  const [selectedCompanies, setSelectedCompanies] = React.useState(["Vi", "Te", "Am", "En", "other"]);
  const [dataSchool, setDataSchool] = useState(null);
  const [dataAntennas, setDataAntennas] = useState(null);
  const [dataSignalArc, setDataSignalArc] = useState([]);

  const mapRef = useRef(null);
  const deckRef = useRef(null);
  const [polygonSignal, setPolygonSignal] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);
  const [viewState, setViewState] = useState({ ...initialViewState });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/features_school_intersects.geojson.gz", {
          responseType: "arraybuffer",
        });

        const decompressedDataSchool = pako.inflate(response.data, { to: "string" });
        let jsonDataSchool = JSON.parse(decompressedDataSchool);
        // calculate signal_index
        jsonDataSchool = {
          ...jsonDataSchool,
          features: jsonDataSchool.features.map((i) => {
            i.properties.signal_index = calculateSignalIndex(i.properties.ant_data);

            return i;
          }),
        };
        setDataSchool(jsonDataSchool);

        const responseAntennas = await axios.get("/cobertura_app_4326.geojson.gz", {
          responseType: "arraybuffer",
        });

        const decompressedDataAntennas = pako.inflate(responseAntennas.data, { to: "string" });
        const jsonDataAntennas = JSON.parse(decompressedDataAntennas);
        setDataAntennas(jsonDataAntennas);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const toggleComponent = (componentName) => {
    if (activeComponent === componentName) {
      setActiveComponent(null);
    } else {
      setActiveComponent(componentName);
    }
  };

  const handleMapClick = (event) => {
    try {
      const pickedInfo = deckRef.current.pickObject({
        x: event.x,
        y: event.y,
        radius: 5,
        layerIds: ["arcs"],
      });

      if (pickedInfo && pickedInfo.object) {
        console.log(" DeckGL :", pickedInfo.object);
      }
    } catch (error) {
      console.error(error);
    }
    try {
      const features = mapRef.current.queryRenderedFeatures([event.x, event.y]);

      const new_features = features.filter((i) => i.layer && LAYERS_ACTION.includes(i.layer.id));
      handleChangePolygonSignal();
      handleChangeDataSignalArc();

      if (!new_features.length) return;
      const feature = { ...new_features[0], lngLat: event.coordinate };

      if (feature.layer.id === "antenas-layer") {
        fetch(`${GEOJSON_URL}/${feature.properties["idx"]}.geojson`)
          .then((response) => response.json())
          .then((data) => {
            handleChangePolygonSignal(data);
          });
      } else {
        const ant_id = JSON.parse(feature.properties.ant_id || "[]").filter((i) => i.points_coords);
        if (ant_id.length) {
          const ant_id_arc = ant_id.map((i) => ({
            sourcePosition: feature.lngLat,
            targetPosition: JSON.parse(i.points_coords),
          }));
          handleChangeDataSignalArc(ant_id_arc);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMapHover = (event) => {
    try {
      const features = mapRef.current.queryRenderedFeatures([event.x, event.y]);
      const new_features = features.filter((i) => i.layer && LAYERS_ACTION.includes(i.layer.id));
      if (new_features.length) {
        const i = { ...new_features[0], lngLat: event.coordinate };
        setHoverInfo({ ...i });
      } else {
        setHoverInfo(null);
      }
    } catch (error) {
      setHoverInfo(null);
      console.error(error);
    }
  };

  const handleLoad = () => {
    const map = mapRef.current.getMap();
    // load images
    const icons = ["bitel", "movistar", "entel", "claro", "antena"];
    icons.forEach((i) => {
      fetch(`${i}.png`)
        .then((response) => response.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            const image = new Image(64, 64);
            image.src = reader.result;
            image.onload = () => {
              map.addImage(i, image);
            };
          };
          reader.readAsDataURL(blob);
        });
    });
  };

  const handleFilter = (filter) => {
    setSelectedCompanies(filter);
  };

  const handleChangePolygonSignal = (data = null) => {
    setPolygonSignal(data);
  };
  const handleChangeDataSignalArc = (data = null) => {
    setDataSignalArc(data);
  };

  const arcLayer = new ArcLayer({
    id: "arcs",
    data: dataSignalArc,
    getSourcePosition: (d) => d.sourcePosition,
    getTargetPosition: (d) => d.targetPosition,
    pickable: true,
    autoHighlight: true,
    getSourceColor: [255, 105, 97],
    getTargetColor: [102, 205, 170],
    highlightColor: [255, 255, 255, 128],
    getHeight: 0.4,
    getWidth: 3,
  });
  const layers = [...(dataSignalArc && dataSignalArc.length ? [arcLayer] : [])];
  
  const handleChangeFocus = (feature) => {
    try {
      setViewState({
        ...viewState,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        zoom: 7.5,
      });
    } catch (error) {}
  };

  return (
    <div id="map-container">
      <DeckGL
        ref={deckRef}
        layers={layers}
        initialViewState={viewState}
        controller={true}
        ContextProvider={MapContext.Provider}
        onClick={handleMapClick}
        onHover={handleMapHover}
      >
        <StaticMap
          ref={mapRef}
          onLoad={handleLoad}
          scrollZoom={true}
          boxZoom={true}
          dragRotate={true}
          doubleClickZoom={true}
          touchZoomRotate={true}
          touchPitch={true}
          minZoom={5}
          maxZoom={16}
          maxPitch={85}
          minPitch={5}
          mapStyle="mapbox://styles/devseed/clnotjmz0008s01pf5whsc05s"
          mapboxAccessToken={API_TOKEN}
          terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
        >
          {dataAntennas ? (
            <Source id="antena-points" type="geojson" data={dataAntennas}>
              <Layer
                id="antenas-layer"
                type="symbol"
                layout={layoutAntena}
                filter={
                  selectedCompanies.length
                    ? ["all", ["in", "ico", ...selectedCompanies]]
                    : ["all", ["==", "ico", "123123123"]]
                }
                maxzoom={18}
                minzoom={MIN_ZOOM_SIGNAL}
              />
            </Source>
          ) : null}
          {dataSchool && (
            <Source id="schools-source" type="geojson" data={dataSchool}>
              <Layer id="schools-layer" type="circle" paint={paintSchool} maxzoom={18} minzoom={MIN_ZOOM_SCHOOL} />
              <Layer
                id="schools-heatmap"
                type="heatmap"
                maxzoom={MAX_ZOOM_HEADMAP}
                minzoom={MIN_ZOOM_HEADMAP}
                paint={paintHeatmap}
              />
            </Source>
          )}
          {polygonSignal && (
            <Source id="polygon-signal" type="geojson" data={polygonSignal}>
              <Layer id="polygon-signal-layer" type="fill" paint={paintPolygonSignal} maxzoom={18} />
            </Source>
          )}
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />
          <ScaleControl position="top-left" />
          <NavigationControl position="top-left" />
        </StaticMap>
      </DeckGL>
      <div className="aside-container">
        <AboutPanel isActive={activeComponent === "AboutPanel"} toggle={() => toggleComponent("AboutPanel")} />
        <OptionsPanel
          handleFilter={handleFilter}
          isActive={activeComponent === "OptionsPanel"}
          toggle={() => toggleComponent("OptionsPanel")}
        />
        <DashboardPanel
          isActive={activeComponent === "DashboardPanel"}
          toggle={() => toggleComponent("DashboardPanel")}
          handleChangeFocus={handleChangeFocus}
        />
        <DetailPoint hoverInfo={hoverInfo} />
      </div>
    </div>
  );
};

export default App;
