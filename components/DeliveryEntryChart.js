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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const DeliveryEntryChart = ({
  bigTitle,
  labelTitle1,
  labelTitle2,
  xdata,
  barColor1,
  barColor2,
  barData1,
  barData2,
}) => {
  const options = {
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
        text: bigTitle,
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

  const data = {
    labels: xdata,
    datasets: [
      {
        label: labelTitle1,
        data: barData1,
        backgroundColor: barColor1,
      },
      {
        label: labelTitle2,
        data: barData2,
        backgroundColor: barColor2,
      },
    ],
  };

  return <Bar options={options} data={data} />;
};

export default DeliveryEntryChart;
