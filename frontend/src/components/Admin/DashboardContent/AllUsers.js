import React from "react";
import { Avatar, Card, CardContent, Grid, Typography } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";

const AllUsers = ({ allUserCount }) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
          <Grid item>
            <Typography color="textSecondary" gutterBottom variant="overline">
              Customers
            </Typography>
            <Typography color="textPrimary" variant="h4">
              {allUserCount}
            </Typography>
          </Grid>
          <Grid item>
            <Avatar
              sx={{
                backgroundColor: "warning.main",
                height: 56,
                width: 56,
              }}
            >
              <GroupIcon />
            </Avatar>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AllUsers;
