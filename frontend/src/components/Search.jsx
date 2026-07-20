import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "./Seo.jsx";
import {
  Section,
  Overline,
  Headline,
  PrimaryBtn,
} from "../design/primitives";

function Search() {
  const [keyword, setKeyword] = useState("");
  const history = useNavigate();

  const searchSubmitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      history(`/products/${keyword}`, { replace: true });
    } else {
      history("/search", { replace: true });
    }
  };

  return (
    <>
      <Seo
        title="Search | Hverdag"
        description="Search the Hverdag collection — kept pieces, makers, materials."
        path="/search"
      />
      <Section>
        <div
          style={{
            maxWidth: 640,
            marginInline: "auto",
            paddingInline: "var(--t-grid-containerPad)",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 48 }}>
            <Overline>Find what you're after</Overline>
            <Headline level="2xl" style={{ marginTop: "4px" }}>
              Look through the shelves
            </Headline>
            <p
              style={{
                color: "var(--t-neutral-500)",
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                marginTop: 12,
              }}
            >
              What would you like to keep next?
            </p>
          </div>
          <form
            onSubmit={searchSubmitHandler}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "stretch",
              justifyContent: "center",
              maxWidth: "100%",
            }}
          >
            <input
              type="search"
              placeholder="Search a product..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: "1 1 240px",
                minWidth: 0,
                padding: "12px 16px",
                border: "1px solid var(--t-neutral-300)",
                borderRadius: "var(--t-border-radius-base)",
                fontFamily: "inherit",
                fontSize: "16px",
                background: "#fff",
                transition: "border-color 200ms cubic-bezier(0,0,0.2,1)",
              }}
            />
            <PrimaryBtn
              type="submit"
              sx={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
            >
              Search
            </PrimaryBtn>
          </form>
        </div>
      </Section>
    </>
  );
}

export default Search;
