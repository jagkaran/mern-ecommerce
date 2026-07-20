import React from "react";
import { Card, CardBody, BodyText, Headline } from "../../../design/primitives";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export const numFormatter = (num) => {
  if (num > 999 && num < 1000000) {
    return (num / 1000).toFixed(1) + "K";
  } else if (num > 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num < 900) {
    return num;
  }
};

function TotalRevenue({ totalRevenue }) {
  return (
    <Card>
      <CardBody>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <BodyText
              small
              style={{
                color: "var(--t-neutral-400)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Total Revenue
            </BodyText>
            <Headline level="3xl" style={{ fontSize: "var(--t-fontSize-3xl)" }}>
              ${numFormatter(totalRevenue)}
            </Headline>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--t-semantic-success)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AttachMoneyIcon />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default TotalRevenue;
