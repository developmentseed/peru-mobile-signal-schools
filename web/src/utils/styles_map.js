import { MAX_ZOOM_HEADMAP } from "./constants";

export const layoutAntena = {
  "icon-image": ["match", ["get", "ico"], "Vi", "bitel", "Te", "movistar", "Am", "claro", "En", "entel", "antena"],
  "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 16, 0.4],
};

export const paintSchool = {
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 15, 7],
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
};

export const paintHeatmap = {
  "heatmap-weight": ["interpolate", ["linear"], ["get", "signal_index"], 0, 0, MAX_ZOOM_HEADMAP, 1],
  "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0, MAX_ZOOM_HEADMAP, 1],
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
  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 2, MAX_ZOOM_HEADMAP, 20],
  "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 4, 1, MAX_ZOOM_HEADMAP, 0],
};

export const paintPolygonSignal = { "fill-color": "#00FF00", "fill-opacity": 0.3 };
