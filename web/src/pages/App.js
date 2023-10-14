import Map, { Source, Layer, NavigationControl, ScaleControl, Popup } from "react-map-gl";
import React, { useRef, useState, useEffect } from "react";

import { TEL_NAMES } from "../utils/constants";
import OptionsPanel from "../components/OptionsPanel.jsx";
import DashboardPanel from "../components/DashboardPanel.jsx";
import AboutPanel from "../components/AboutPanel.jsx";

import axios from "axios";
import pako from "pako";
import { calculate_signal_index } from "../utils/utils";
const API_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
const GEOJSON_URL = process.env.REACT_APP_GEOJSON_URL;

const App = () => {
  const [selectedCompanies, setSelectedCompanies] = React.useState(["Vi", "Te", "Am", "En", "other"]);
  const [dataSchool, setDataSchool] = useState(null);
  const [dataAntennas, setDataAntennas] = useState(null);

  const mapRef = useRef(null);
  const [polygonSygnal, setPolygonSygnal] = useState(null);
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
    if (!features.length) return;
    const featuresSchool = features.filter((i) => i.sourceLayer === "ayacucho_schools");
    const featuresAntenas = features.filter((i) => i.sourceLayer === "ayacucho_antenas");
    if (featuresAntenas.length) {
      const antena = featuresAntenas[0];
      fetch(`${GEOJSON_URL}/${antena.properties["NUM"]}.geojson`)
        .then((response) => response.json())
        .then((data) => {
          handleChangePolygonSygnal(data);
        })
        .catch((err) => {
          console.error(err);
          handleChangePolygonSygnal();
        });
    } else if (featuresSchool.length) {
      handleChangePolygonSygnal();
    } else {
      handleChangePolygonSygnal();
    }
  };

  const handleMapHover = (event) => {
    try {
      const features = mapRef.current.queryRenderedFeatures(event.point);
      const new_features = features.filter((i) => ["ayacucho_schools", "ayacucho_antenas"].includes(i.sourceLayer));
      if (new_features.length) {
        const i = new_features[0];
        const props = i.properties;

        var data = { sub0: null, sub1: null, sub2: null };
        data.type = i.sourceLayer;
        data.longitude = event.lngLat.lng;
        data.latitude = event.lngLat.lat;
        if (i.sourceLayer === "ayacucho_schools") {
          data.name = props.name || "- Sin Nombre -";
          data.sub1 = `Distrito: ${props["addr:subdistrict"] || ""}`;
          data.sub2 = `Fuente: ${props["source"] || "OSM"}`;
        } else {
          data.name = TEL_NAMES[props.EMP_OPER_TRUNC] || "--";
          data.sub1 = props.HASTA_1_MBPS ? "Velocidad: Hasta 1Mbps" : "";
          data.sub2 = props["M�S_DE_1_MBPS"] ? "Velocidad: Más 1Mbps" : "";
          data.sub0 = ` - ( ${props["2G"] ? "2G " : ""}${props["3G"] ? "3G " : ""}${props["4G"] ? "4G " : ""}${
            props["5G"] ? "5G " : ""
          })`.replaceAll("  ", " ");
        }
        setHoverInfo({ ...data });
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

  const handleChangePolygonSygnal = (data = null) => {
    setPolygonSygnal(data);
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
              layout={{
                "icon-image": [
                  "match",
                  ["get", "ico"],
                  "Vi",
                  "bitel",
                  "Te",
                  "movistar",
                  "Am",
                  "claro",
                  "En",
                  "entel",
                  "antena",
                ],
                "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 16, 0.4],
              }}
              filter={
                selectedCompanies.length
                  ? ["all", ["in", "ico", ...selectedCompanies]]
                  : ["all", ["==", "ico", "123123123"]]
              }
              maxzoom={18}
              minzoom={10}
            />
          </Source>
        ) : null}

        {dataSchool && (
          <Source id="polygonSygnal" type="geojson" data={dataSchool}>
            <Layer
              id="schools-layer"
              type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 2, 15, 7],
                "circle-color": [
                  "case",
                  ["==", ["get", "signal_index"], 0],
                  "#c70505",
                  ["<=", ["get", "signal_index"], 45],
                  "#ffd1a1",
                  ["<=", ["get", "signal_index"], 172],
                  "#FFFFB3",
                  "#A8E6CF",
                ],
              }}
              maxzoom={18}
              minzoom={9}
            />
            <Layer
              id="schools-heatmap"
              type="heatmap"
              maxzoom={10}
              minzoom={4}
              paint={{
                "heatmap-weight": ["interpolate", ["linear"], ["get", "signal_index"], 0, 0, 9, 1],
                "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0, 9, 1],
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(199, 5, 5, 0)",
                  0.1,
                  "#c70505",
                  0.3,
                  "#ffd1a1",
                  0.5,
                  "#FFFFB3",
                  0.7,
                  "#d9ea98",
                  1,
                  "#A8E6CF",
                ],
                "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 2, 9, 20],
                "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 4, 1, 9, 0],
              }}
            />
          </Source>
        )}
        {polygonSygnal && (
          <Source id="polygonSygnal" type="geojson" data={polygonSygnal}>
            <Layer
              id="polygonSygnal-layer"
              type="fill"
              paint={{
                "fill-color": "#00FF00",
                "fill-opacity": 0.3,
              }}
              maxzoom={17}
            />
          </Source>
        )}
        {hoverInfo && (
          <Popup longitude={hoverInfo.longitude} latitude={hoverInfo.latitude} offset={[0, -10]} closeButton={false}>
            {hoverInfo.name}
            {hoverInfo.sub0}
            {hoverInfo.sub1 && (
              <>
                <br />
                {hoverInfo.sub1}
              </>
            )}
            {hoverInfo.sub2 && (
              <>
                <br />
                {hoverInfo.sub2}
              </>
            )}
          </Popup>
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
