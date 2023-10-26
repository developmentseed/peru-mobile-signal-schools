import React from "react";
import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const FullHeightContainer = styled(Container)({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
});

const Layout = ({ children }) => {
  return (
    <FullHeightContainer disableGutters={true} maxWidth={false}>
      {children}
    </FullHeightContainer>
  );
};

export default Layout;
