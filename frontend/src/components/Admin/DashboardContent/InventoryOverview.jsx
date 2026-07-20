import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Card, CardBody, Headline, BodyText } from "../../../design/primitives";

function InventoryOverview({ outOfStock, inStock }) {
  const data = {
    datasets: [
      {
        data: [outOfStock, inStock],
        backgroundColor: ["#e53935", "#3F51B5"],
        borderWidth: 8,
        borderColor: "#FFFFFF",
        hoverBorderColor: "#FFFFFF",
      },
    ],
    labels: ["Out of Stock", "In Stock"],
  };

  const options = {
    animation: true,
    cutoutPercentage: 80,
    layout: { padding: 0 },
    legend: { display: false },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <Card>
      <CardBody>
        <Headline level="lg" style={{ marginBottom: 16 }}>
          Inventory Overview
        </Headline>
        <div style={{ height: 300, position: "relative" }}>
          <Doughnut data={data} options={options} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginTop: 16,
          }}
        >
          <BodyText small style={{ color: "var(--t-neutral-500)" }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#e53935",
                marginRight: 6,
              }}
            />
            Out of Stock ({outOfStock})
          </BodyText>
          <BodyText small style={{ color: "var(--t-neutral-500)" }}>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3F51B5",
                marginRight: 6,
              }}
            />
            In Stock ({inStock})
          </BodyText>
        </div>
      </CardBody>
    </Card>
  );
}

export default InventoryOverview;
