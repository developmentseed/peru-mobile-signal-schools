import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

import {
  antenasRadarData,
  optionsRadarData,
  antenasBarData,
  optionsAntenasBarData,
  schoolPieData,
  optionsPieData,
  schoolsBarData,
  optionsschoolsBarData,
} from "../utils/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
);
const DashboardPanel = ({ isActive, toggle }) => {
  if (!isActive) {
    return (
      <div className="large-component">
        <button className="collapsible-button" onClick={toggle}>
          <span>Panel de Control</span>
          <span>→</span>
        </button>
      </div>
    );
  }
  return (
    <div className="large-component">
      <div className="collapsible-content">
        <div className="collapsible-header">
          <h3>Panel de Control</h3>
          <span onClick={toggle}>←</span>
        </div>
        <div className="chart-container">
          <div className="chart-column">
            <Bar data={antenasRadarData} options={optionsRadarData} height={320} />
            <hr />
            <Bar data={antenasBarData} options={optionsAntenasBarData} height={200} />
          </div>
          <div className="chart-column">
            <Doughnut data={schoolPieData} options={optionsPieData} height={340} />
            <hr />
            <Bar data={schoolsBarData} options={optionsschoolsBarData} height={200} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPanel;
