import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import faker from "faker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "white",
        font: {
          size: 13,
        },
      },
    },
    title: {
      display: true,
      text: "整體每日儲位使用長條圖",
      color: "white",
      font: {
        size: 16,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: "white",
      },
      grid: {
        color: "rgb(31 41 55)",
      },
    },
    y: {
      ticks: {
        color: "white",
      },
      grid: {
        color: "rgb(31 41 55)",
      },
    },
  },
};

const labels = () => {
  let labelsList = [];
  let num = 0;
  for (let i = 0; i < 31; i++) {
    num += 1;
    labelsList.push(`${num}日`);
  }
  return labelsList;
};

export const data = {
  labels: labels(),
  datasets: [
    {
      label: "儲位使用",
      data: labels().map(() => faker.datatype.number({ min: 0, max: 1000 })),
      backgroundColor: "rgb(168 162 158)",
    },
  ],
};

const StorageBinChart = () => {
  return <Bar options={options} data={data} />;
};

export default StorageBinChart;
