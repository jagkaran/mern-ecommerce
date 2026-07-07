import React from "react";
import { Card, CardBody, BodyText, Headline } from "../../../design/primitives";
import GroupIcon from "@mui/icons-material/People";

function AllUsers({ allUserCount }) {
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
            <BodyText small style={{ color: "var(--t-neutral-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Customers
            </BodyText>
            <Headline level="3xl" style={{ fontSize: "var(--t-fontSize-3xl)" }}>
              {allUserCount ?? 0}
            </Headline>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#A16207",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GroupIcon />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default AllUsers;
