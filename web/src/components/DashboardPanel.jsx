import React, { useEffect, useState, useRef } from "react";

import axios from "axios";
import pako from "pako";
import { DeckGL, GeoJsonLayer } from "deck.gl";
import { center } from "@turf/turf";

import {
  antenasRadarData,
  optionsRadarData,
  antenasBarData,
  optionsAntenasBarData,
  schoolPieData,
  optionsPieData,
} from "../utils/constants";

import CustomBar from "./CustomBar.jsx";

const INITIAL_VIEW_STATE = {
  latitude: -9.193376,
  longitude: -74.5003145,
  zoom: 3.4,
  pitch: 0,
  bearing: 0,
};

const DashboardPanel = ({ isActive, toggle, handleChangeFocus }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const [infoFeature, setInfoFeature] = useState(null);

  const deckRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/assets/per-adm1.geojson.gz", {
          responseType: "arraybuffer",
        });

        const decompressedDataSchool = pako.inflate(response.data, { to: "string" });
        let jsonDataSchool = JSON.parse(decompressedDataSchool);

        setGeojsonData(jsonDataSchool);
        const responseStats = await axios.get("/assets/data_stats.json");
        setDataStats({ ...responseStats.data });
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const layers = [
    new GeoJsonLayer({
      id: "geojson-layer",
      data: geojsonData,
      stroked: true,
      filled: true,
      pickable: true,
      lineWidthMinPixels: 1,
      getLineColor: [30, 61, 89],
      getFillColor: [255, 195, 0, 190],
    }),
  ];

  const onClickHandler = (info) => {
    if (info && info.object && dataStats !== null) {
      const { properties } = info.object;
      setInfoFeature({ ...dataStats[properties.shapeName] });
      try {
        handleChangeFocus(center(info.object));
      } catch (error) {}
    }
  };

  if (!isActive) {
    return (
      <div className="large-component">
        <button className="collapsible-button" onClick={toggle}>
          <span>Dashboard</span>
          <span>→</span>
        </button>
      </div>
    );
  }

  const getTooltip = (info) => {
    return (
      info &&
      info.object &&
      info.object.properties && {
        html: ` <div><b>${info.object.properties.shapeName}</b></div>  `,
      }
    );
  };
  return (
    <div className="large-component">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>Dashboard {infoFeature && infoFeature.name}</h3>
          <span onClick={toggle}>←</span>
        </div>
        <div className="chart-container">
          <div className="chart-column">
            <div id="map-container-stats">
              <DeckGL
                ref={deckRef}
                initialViewState={INITIAL_VIEW_STATE}
                controller={{
                  dragPan: false,
                  dragRotate: false,
                  scrollZoom: false,
                  doubleClickZoom: false,
                }}
                layers={layers}
                onClick={onClickHandler}
                getTooltip={getTooltip}
              />
            </div>
            {infoFeature && (
              <>
                <hr />
                <CustomBar
                  dataRaw={infoFeature}
                  generatorData={antenasRadarData}
                  generatorOption={optionsRadarData}
                  height={320}
                />
              </>
            )}
          </div>
          {infoFeature && (
            <div className="chart-column">
              <CustomBar
                dataRaw={infoFeature}
                generatorData={antenasBarData}
                generatorOption={optionsAntenasBarData}
                height={300}
              />
              <hr />
              <CustomBar
                dataRaw={infoFeature}
                generatorData={schoolPieData}
                generatorOption={optionsPieData}
                height={320}
                variant="donut"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DashboardPanel;
