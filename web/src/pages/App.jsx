import axios from "axios";
import pako from "pako";
import Map, { Source, Layer, NavigationControl, ScaleControl } from "react-map-gl";
import React, { useRef, useState, useEffect } from "react";

import OptionsPanel from "../components/OptionsPanel.jsx";
import DashboardPanel from "../components/DashboardPanel.jsx";
import AboutPanel from "../components/AboutPanel.jsx";
import CustomPopup from "../components/CustomPopup.jsx";
import { calculate_signal_index } from "../utils/utils.js";
import { layoutAntena, paintSchool, paintHeatmap, paintPolygonSignal } from "../utils/styles_map.js";
import { MAX_ZOOM_HEADMAP, MIN_ZOOM_HEADMAP, MIN_ZOOM_SCHOOL, MIN_ZOOM_SIGNAL } from "../utils/constants.js";

const API_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const GEOJSON_URL = process.env.REACT_APP_GEOJSON_URL;
const LAYERS_ACTION = ["schools-layer", "antenas-layer"];
const App = () => {
  const [selectedCompanies, setSelectedCompanies] = React.useState(["Vi", "Te", "Am", "En", "other"]);
  const [dataSchool, setDataSchool] = useState(null);
  const [dataAntennas, setDataAntennas] = useState(null);

  const mapRef = useRef(null);
  const [polygonSignal, setPolygonSignal] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [activeComponent, setActiveComponent] = useState(null);

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
            i.properties.signal_index = calculate_signal_index(i.properties.ant_data);

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
    const features = mapRef.current.queryRenderedFeatures(event.point);
    const new_features = features.filter((i) => i.layer && LAYERS_ACTION.includes(i.layer.id));
    handleChangePolygonSignal();

    if (!new_features.length) return;
    const feature = { ...new_features[0], lngLat: event.lngLat };

    if (feature.layer.id === "antenas-layer") {
      fetch(`${GEOJSON_URL}/${feature.properties["idx"]}.geojson`)
        .then((response) => response.json())
        .then((data) => {
          handleChangePolygonSignal(data);
        })
        .catch((err) => {
          console.error(err);
          handleChangePolygonSignal();
        });
    } else {
      handleChangePolygonSignal();
    }
  };

  const handleMapHover = (event) => {
    try {
      const features = mapRef.current.queryRenderedFeatures(event.point);
      const new_features = features.filter((i) => i.layer && LAYERS_ACTION.includes(i.layer.id));
      if (new_features.length) {
        const i = { ...new_features[0], lngLat: event.lngLat };
        setHoverInfo({ ...i });
      } else {
        setHoverInfo(null);
      }
    } catch (error) {
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

  return (
    <div id="map-container">
      <Map
        ref={mapRef}
        onLoad={handleLoad}
        initialViewState={{
          latitude: -13.53774,
          longitude: -74.12402,
          zoom: 7.5,
          pitch: 25,
          bearing: 15,
        }}
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
        onClick={handleMapClick}
        onMouseMove={handleMapHover}
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
        <CustomPopup hoverInfo={hoverInfo} />
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        <ScaleControl position="top-left" />
        <NavigationControl position="top-left" />
      </Map>
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
        />
      </div>
    </div>
  );
};

export default App;
