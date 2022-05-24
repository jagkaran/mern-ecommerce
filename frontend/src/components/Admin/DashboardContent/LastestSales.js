import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import { Box, Card, CardContent, CardHeader, Divider } from "@mui/material";

function LastestSales({ totalRevenue }) {
  const data = {
    datasets: [
      {
        backgroundColor: "#3F51B5",
        barPercentage: 0.5,
        barThickness: 12,
        borderRadius: 4,
        categoryPercentage: 0.5,
        data: [0, totalRevenue],
        label: "TOTAL AMOUNT",
        maxBarThickness: 10,
      },
    ],
    labels: ["Initial Amount", "Amount Earned"],
  };

  const options = {
    animation: true,
    cornerRadius: 20,
    layout: { padding: 0 },
    legend: { display: false },
    maintainAspectRatio: false,
    responsive: true,
    xAxes: [
      {
        ticks: {
          fontColor: "#65748B",
        },
        gridLines: {
          display: false,
          drawBorder: false,
        },
      },
    ],
    yAxes: [
      {
        ticks: {
          fontColor: "#65748B",
          beginAtZero: true,
          min: 0,
        },
        gridLines: {
          borderDash: [2],
          borderDashOffset: [2],
          color: "#E6E8F0",
          drawBorder: false,
          zeroLineBorderDash: [2],
          zeroLineBorderDashOffset: [2],
          zeroLineColor: "#E6E8F0",
        },
      },
    ],
    tooltips: {
      backgroundColor: "#FFFFFF",
      bodyFontColor: "#65748B",
      borderColor: "#E6E8F0",
      borderWidth: 1,
      enabled: true,
      footerFontColor: "#65748B",
      intersect: false,
      mode: "index",
      titleFontColor: "#121828",
    },
  };

  return (
    <Card>
      <CardHeader title="Latest Sales" />
      <Divider />
      <CardContent>
        <Box
          sx={{
            height: 400,
            position: "relative",
          }}
        >
          <Line data={data} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default LastestSales;
