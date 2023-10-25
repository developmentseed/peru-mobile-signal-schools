const axios = require("axios");
const pako = require("pako");
const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const URL =
  "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/PER/ADM1/geoBoundaries-PER-ADM1.geojson";

const signal_types = ["2G", "3G", "4G", "5G", "up_1mb", "plus_1mb"];
const companies = ["Vi", "Te", "Am", "En"];
const status_signal = ["No signal", "Low signal", "Medium signal", "High signal"];

// top 5 distritos senial baja
async function fetchJSONWithAxios(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching data with Axios:", error);
    throw error;
  }
}

// Uso de la función

async function fetchGzipedGeoJSON(filename) {
  const filePath = path.join(__dirname, "public", filename);
  const data = fs.readFileSync(filePath);
  const decompressed = pako.inflate(data, { to: "string" });
  return JSON.parse(decompressed).features;
}

function calculateIdexSchool(school_data) {
  let indexSchool = 0;
  if (school_data.plus_1mb === "1") {
    indexSchool += 3;
  }
  if (school_data.up_1mb === "1") {
    indexSchool += 1;
  }

  return indexSchool;
}
(async () => {
  try {
    let boundaries = null;

    await fetchJSONWithAxios(URL)
      .then((responseData) => {
        boundaries = responseData.features;
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    if (!boundaries) {
      console.error("no boundaries:", boundaries);
      return null;
    }

    console.log("Data from first file:", boundaries.length);

    const schools = await fetchGzipedGeoJSON("features_school_intersects.geojson.gz");
    console.log("Data from second file:", schools.length);

    const antennas = await fetchGzipedGeoJSON("cobertura_app_4326.geojson.gz");
    console.log("Data from second file:", antennas.length);
    // iterate for geometries
    const stats = boundaries.map((boundary) => {
      const boundaryGeometry = boundary.geometry;

      const schoolsInBoundary = schools.filter((school) =>
        turf.booleanPointInPolygon(school.geometry, boundaryGeometry),
      );

      const antennasInBoundary = antennas.filter((antenna) =>
        turf.booleanPointInPolygon(antenna.geometry, boundaryGeometry),
      );
      // group antennas
      const antennasConcatenate = antennasInBoundary
        .map((feat_ant) => feat_ant.properties.features_intersec)
        .reduce((acc, twoD) => {
          return acc.concat(
            twoD.reduce((acc2, oneD) => {
              return acc2.concat(oneD);
            }, []),
          );
        }, []);

      const antennasStats = companies.map((company) => {
        const antennasFilter = antennasConcatenate.filter((feat_antenna) => feat_antenna.emp === company);
        const antenasFilterBySignal = signal_types.map((st) => {
          return {
            signal_type: st,
            count: antennasFilter.filter((i) => i[st] === "1").length,
          };
        });
        return {
          emp: company,
          count: antennasFilter.length,
          by_signal_type: Object.fromEntries(antenasFilterBySignal.map((i) => [i.signal_type, i.count])),
        };
      });

      const schoolStats = schoolsInBoundary.map((i) => {
        const indexCount = (i.properties.ant_data || [])
          .map((ad) => calculateIdexSchool(ad))
          .reduce((partialSum, a) => partialSum + a, 0);

        if (indexCount === 0) {
          return "No signal";
        }
        if (indexCount <= 45) {
          return "Low signal";
        }
        if (indexCount <= 172) {
          return "Medium signal";
        }
        return "High signal";
      });
      const schoolIndexList = status_signal.map((i) => {
        return {
          index: i,
          count: schoolStats.filter((j) => i === j).length,
        };
      });
      return {
        name: boundary.properties.shapeName,
        schoolsCount: schoolsInBoundary.length,
        antennasCount: antennasConcatenate.length,
        antennasSignal: Object.fromEntries(antennasStats.map((i) => [i.emp, i])),
        schoolIndex: Object.fromEntries(schoolIndexList.map((i) => [i.index, i.count])),
      };
    });

    const schoolIndexObj = Object.fromEntries(stats.map((i) => [i.name, i]));
 

    const data = JSON.stringify(schoolIndexObj, null, 4);
    const filepath = path.join(__dirname, "public", "data_stats.json");

    fs.writeFileSync(filepath, data);

    console.log("Datos saved in ", filepath);
  } catch (error) {
    console.error("Error:", error);
  }
})();
