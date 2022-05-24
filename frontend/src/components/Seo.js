import React from "react";
import { Helmet } from "react-helmet";

function Seo({ title, description, path }) {
  const url = `http://localhost:3000/${path}`;
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
