import { Rating } from "@mui/material";
import React from "react";

function Reviewcard({ name, rating, comment, profileImg, createdAt }) {
  return (
    <div className="bg-white dark:bg-gray-800 w-full rounded-lg p-4 mb-6 shadow sm:inline-block">
      <div className="flex items-start text-left">
        <div className="flex-shrink-0">
          <div className="inline-block relative">
            <a href="/abc" className="block relative">
              <img
                alt="profil"
                src={
                  profileImg
                    ? profileImg
                    : "https://icon-library.com/images/white-profile-icon/white-profile-icon-24.jpg"
                }
                className="mx-auto object-cover rounded-full h-16 w-16 "
              />
            </a>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              className="fill-current text-white bg-green-600 rounded-full p-1 absolute bottom-0 right-0 w-6 h-6 -mx-1 -my-1"
            >
              <path d="M19 11a7.5 7.5 0 0 1-3.5 5.94L10 20l-5.5-3.06A7.5 7.5 0 0 1 1 11V3c3.38 0 6.5-1.12 9-3 2.5 1.89 5.62 3 9 3v8zm-9 1.08l2.92 2.04-1.03-3.41 2.84-2.15-3.56-.08L10 5.12 8.83 8.48l-3.56.08L8.1 10.7l-1.03 3.4L10 12.09z"></path>
            </svg>
          </div>
        </div>
        <div className="ml-6">
          <p className="flex items-baseline">
            <span className="text-gray-600 capitalize dark:text-gray-200 font-bold">
              {name}
            </span>
          </p>
          <div className="flex items-center mt-1">
            <Rating
              name="half-rating-read"
              value={rating}
              precision={0.5}
              readOnly
            />
          </div>
          <div className="mt-3">
            <p className="mt-1 max-w-xs dark:text-white">{comment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reviewcard;
