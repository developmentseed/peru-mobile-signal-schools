export const TEL_NAMES = {
  Vi: "Bitel Perú",
  Te: "Telefónica",
  Am: "América Móvil",
  En: "Entel Perú ",
};

const companyColors = {
  Vi: "rgba(76, 175, 80, 0.7)",
  Te: "rgba(33, 150, 243, 0.7)",
  Am: "rgba(255, 152, 0, 0.7)",
  En: "rgba(38, 198, 218, 0.7)",
};

const companyBorderColors = {
  Vi: "#4CAF50",
  Te: "#2196F3",
  Am: "#FF9800",
  En: "#26C6DA",
};
// radar chart - antenas
export const antenasRadarData = {
  labels: ["2G", "3G", "4G", "5G", "Hasta 1Mbps", "Más 1Mbps"],
  datasets: [
    {
      label: "Bitel",
      data: [0, 1234, 636, 0, 0, 1336],
      backgroundColor: companyColors.Vi,
      borderColor: companyBorderColors.Vi,
    },
    {
      label: "Telefónica",
      data: [8, 52, 209, 0, 59, 209],
      backgroundColor: companyColors.Te,
      borderColor: companyBorderColors.Te,
    },
    {
      label: "América",
      data: [0, 201, 117, 0, 201, 117],
      backgroundColor: companyColors.Am,
      borderColor: companyBorderColors.Am,
    },
    {
      label: "Entel",
      data: [0, 61, 137, 0, 61, 137],
      backgroundColor: companyColors.En,
      borderColor: companyBorderColors.En,
    },
  ],
};

export const optionsRadarData = {
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
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
      text: "Número de servicios ofrecidos por tecnología",
      color: "white",
    },
  },
};

// bar antenas
export const antenasBarData = {
  labels: ["Bitel", "Telefónica", "América", "Entel"],
  datasets: [
    {
      label: "Dataset 1",
      data: [1336, 268, 205, 198],
      backgroundColor: [companyColors.Vi, companyColors.Te, companyColors.Am, companyColors.En],
      borderColor: [companyBorderColors.Vi, companyBorderColors.Te, companyBorderColors.Am, companyBorderColors.En],
      borderWidth: 1,
    },
  ],
};
const maxValueAntenasBarData = Math.max(...antenasBarData.datasets[0].data);

export const optionsAntenasBarData = {
  scales: {
    x: {
      min: 0,
      max: maxValueAntenasBarData,
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
      text: "Distribución de 2,007 antenas por compañía",
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

// pie schools
export const schoolPieData = {
  labels: ["Sin señal", "Baja", "Media", "Alta"],
  datasets: [
    {
      label: "Instituciones educativas",
      data: [670, 776, 392, 122],
      backgroundColor: [
        "rgba(199, 5, 5, 0.4)",
        "rgba(255, 209, 161, 0.4)",
        "rgba(255, 255, 179, 0.4)",
        "rgba(168, 230, 207, 0.4)",
      ],
      borderColor: ["#8a0404", "rgba(255, 209, 161, 1)", "rgba(255, 255, 179, 1)", "rgba(168, 230, 207, 1)"],
      borderWidth: 1,
    },
  ],
};
export const optionsPieData = {
  plugins: {
    legend: {
      labels: {
        color: "white",
      },
    },
    title: {
      display: true,
      text: "Distribución de las 1,960 instituciones educativas según la calidad del servicio",
      color: "white",
    },
  },
};
// bar schools
export const schoolsBarData = {
  labels: ["Lucanas", "Huanta", "Parinacochas", "La Mar", "Sucre", "Otros"],
  datasets: [
    {
      label: "Dataset 1",
      data: [189, 88, 88, 84, 50, 171],
      backgroundColor: [
        "rgba(85, 139, 47, 0.7)",
        "rgba(100, 149, 237, 0.7)",
        "rgba(147, 112, 219, 0.7)",
        "rgba(238, 221, 130, 0.7)",
        "rgba(205, 92, 92, 0.7)",
        "rgba(127, 255, 212, 0.7)",
      ],
      borderColor: ["#558B2F", "#6495ED", "#9370DB", "#EEDD82", "#CD5C5C", "#7FFFD4"],
      borderWidth: 1,
    },
  ],
};
const maxValueSchoolsBarData = Math.max(...schoolsBarData.datasets[0].data);

export const optionsschoolsBarData = {
  scales: {
    x: {
      min: 0,
      max: maxValueSchoolsBarData,
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
      text: "Top 5 provincias con falta de servicios",
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
