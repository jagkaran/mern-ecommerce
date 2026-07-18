import React from "react";
import { Link } from "react-router-dom";
import Seo from "./Seo";
import {
  Headline,
  BodyText,
  Overline,
  PrimaryBtn,
  SecondaryBtn,
} from "../design/primitives";

function NotFound() {
  return (
    <>
      <Seo
        title="Not found | Hverdag"
        description="The page you were looking for has wandered off. Try the navigation."
        path="/notfound"
      />
      <section
        style={{
          paddingBlock: "var(--t-space-4xl)",
          backgroundColor: "var(--t-neutral-50)",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
            textAlign: "center",
            paddingTop: "var(--t-space-2xl)",
          }}
        >
          <Overline sx={{ display: "block", mb: 2, color: "var(--t-neutral-500)" }}>
            Lost in the workshop
          </Overline>
          <Headline level="3xl" style={{ marginBottom: 16 }}>
            We can't find that page.
          </Headline>
          <BodyText
            lead
            style={{
              color: "var(--t-neutral-500)",
              fontFamily: "var(--t-fontFamily-display)",
              fontStyle: "italic",
              marginBottom: 40,
            }}
          >
            It may have wandered off, or never existed. Try the navigation, or head back to the
            front door.
          </BodyText>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link to="/" style={{ textDecoration: "none" }}>
              <PrimaryBtn>Back to home</PrimaryBtn>
            </Link>
            <Link to="/products" style={{ textDecoration: "none" }}>
              <SecondaryBtn component="span">Browse the collection</SecondaryBtn>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default NotFound;
