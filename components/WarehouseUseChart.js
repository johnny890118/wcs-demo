import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const WarehouseUseChart = () => {
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
        text: "整體儲位使用率",
        color: "white",
        font: {
          size: 16,
        },
      },
    },
  };

  // Stable display fixture until this chart reads a WMS projection.
  const using = 6240;
  const notUsing = 3760;

  const data = {
    labels: [`使用中 : ${using}`, `未使用 : ${notUsing}`],
    datasets: [
      {
        data: [using, notUsing],
        backgroundColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 0,
      },
    ],
  };

  return <Pie data={data} options={options} />;
};

export default WarehouseUseChart;
