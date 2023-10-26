import React from "react";

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

const CustomBar = ({ dataRaw, generatorData, generatorOption, height, variant = "bar" }) => {
  if (!dataRaw) return null;

  const data = generatorData(dataRaw);
  const options = generatorOption(data);
  if (variant === "donut") {
    return <Doughnut data={data} options={options} height={height} />;
  }

  return <Bar data={data} options={options} height={height} />;
};
export default CustomBar;
