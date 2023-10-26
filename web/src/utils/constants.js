export const TEL_NAMES = {
  Vi: "Bitel Perú",
  Te: "Telefónica",
  Am: "América Móvil",
  En: "Entel Perú",
};
export const TEL_NAMES_ICO = {
  Vi: "bitel.png",
  Te: "movistar.png",
  Am: "claro.png",
  En: "entel.png",
};
export const companyColors = {
  Vi: "rgba(76, 175, 80, 0.7)",
  Te: "rgba(33, 150, 243, 0.7)",
  Am: "rgba(255, 152, 0, 0.7)",
  En: "rgba(38, 198, 218, 0.7)",
};

export const companyBorderColors = {
  Vi: "#4CAF50",
  Te: "#2196F3",
  Am: "#FF9800",
  En: "#26C6DA",
};

const signalType = ["2G", "3G", "4G", "5G", "up_1mb", "plus_1mb"];
const statusSignal = ["No signal", "Low signal", "Medium signal", "High signal"];
const statusSignalBackgroundColor = {
  "No signal": "rgba(199, 5, 5, 0.4)",
  "Low signal": "rgba(255, 209, 161, 0.4)",
  "Medium signal": "rgba(255, 255, 179, 0.4)",
  "High signal": "rgba(168, 230, 207, 0.4)",
};
const statusSignalBorderColor = {
  "No signal": "#8a0404",
  "Low signal": "rgba(255, 209, 161, 1)",
  "Medium signal": "rgba(255, 255, 179, 1)",
  "High signal": "rgba(168, 230, 207, 1)",
};

export const MAX_ZOOM_HEADMAP = 10;
export const MIN_ZOOM_HEADMAP = 4;
export const MIN_ZOOM_SCHOOL = 9;
export const MIN_ZOOM_SIGNAL = 9;

// radar chart - antenas
export const antenasRadarData = (data) => {
  const datasets = Object.entries(TEL_NAMES).map((entry) => {
    const key = entry[0];
    const companyname = entry[1];
    return {
      label: companyname,
      data: signalType.map((i) => data.antennasSignal[key].by_signal_type[i]),
      backgroundColor: companyColors[key],
      borderColor: companyBorderColors[key],
    };
  });

  return {
    labels: [...signalType.map((i) => i.replace("_", " "))],
    datasets,
  };
};

export const optionsRadarData = () => {
  return {
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: "white",
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: "white",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
      title: {
        display: true,
        text: "Number of services offered by technology.",
        color: "white",
      },
    },
  };
};

// bar antenas

export const antenasBarData = (data) => {
  const TEL_NAME_KEYS = Object.entries(TEL_NAMES).map((entry) => entry[0]);
  return {
    labels: TEL_NAME_KEYS.map((entry) => TEL_NAMES[entry]),
    datasets: [
      {
        label: "Dataset 1",
        data: TEL_NAME_KEYS.map((i) => data.antennasSignal[i].count),
        backgroundColor: TEL_NAME_KEYS.map((i) => companyColors[i]),
        borderColor: TEL_NAME_KEYS.map((i) => companyBorderColors[i]),
        borderWidth: 1,
      },
    ],
  };
};

export const optionsAntenasBarData = (x) => {
  const maxValue = Math.max(...x.datasets[0].data);

  return {
    scales: {
      x: {
        min: 0,
        max: maxValue,
        ticks: {
          color: "white",
          backdropColor: "rgba(0, 0, 0, 0)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          display: false,
        },
      },
      title: {
        display: true,
        text: "Antenna distribution by company",
        color: "white",
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return tooltipItem.dataset.data[tooltipItem.dataIndex];
          },
        },
      },
    },
  };
};

// pie schools
export const schoolPieData = (data) => {
  return {
    labels: [...statusSignal],
    datasets: [
      {
        label: "educational institutions",
        data: statusSignal.map((i) => data.schoolIndex[i]),
        backgroundColor: statusSignal.map((i) => statusSignalBackgroundColor[i]),
        borderColor: statusSignal.map((i) => statusSignalBorderColor[i]),
        borderWidth: 1,
      },
    ],
  };
};
export const optionsPieData = () => {
  return {
    plugins: {
      legend: {
        labels: {
          color: "white",
        },
      },
      title: {
        display: true,
        text: "Distribution of educational institutions based on service quality.",
        color: "white",
      },
    },
  };
};
