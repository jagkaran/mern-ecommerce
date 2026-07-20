import React from "react";
import { Helmet } from "react-helmet-async";

function Seo({ title, description, path }) {
  const url = `${process.env.REACT_APP_SITE_URL || "http://localhost:3000"}/${path}`;
  return (
    <div>
      <Helmet
        htmlAttributes={{ lang: "en" }}
        title={title}
        meta={[
          {
            name: "description",
            content: description,
          },
        ]}
        links={[
          {
            rel: "canonical",
            href: url,
          },
        ]}
      />
    </div>
  );
}

export default Seo;
