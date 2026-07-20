import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { Card, CardBody, Headline } from "../../../design/primitives";

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
  };

  return (
    <Card>
      <CardBody>
        <Headline level="lg" style={{ marginBottom: 16 }}>
          Latest Sales
        </Headline>
        <div style={{ height: 300, position: "relative" }}>
          <Line data={data} options={options} />
        </div>
      </CardBody>
    </Card>
  );
}

export default LastestSales;
