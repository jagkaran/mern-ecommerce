import { TextField } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Copyright from "./Copyright";
import Seo from "./Seo";

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
        title="Search New and Trendy on world's best product store"
        description="Search New and Trendy on world's best product store"
        path="/search"
      />
      <div>
        <form
          className="w-full h-full max-w-full md:flex-none flex items-center justify-center"
          onSubmit={searchSubmitHandler}
        >
          <TextField
            label="Search a Product..."
            type="search"
            onChange={(e) => setKeyword(e.target.value)}
            className="lg:w-1/4 sm:w-1/2 md:w-1/2"
          />
          <input
            className="p-4 mx-4 h-full text-gray-700 max-h-full transition ease-in duration-200 uppercase rounded-full hover:bg-gray-800 hover:text-white border-1 focus:outline-none"
            type="submit"
            value="Search"
          />
        </form>
      </div>
      <Copyright />
    </>
  );
}

export default Search;
