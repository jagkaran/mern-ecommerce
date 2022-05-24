import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import "./Banner.css";

function Banner() {
  const images = [
    {
      id: 1,
      src: "banner/banner-1_50.jpg",
    },
    {
      id: 2,
      src: "banner/banner-4_50.jpg",
    },
    {
      id: 3,
      src: "banner/banner-6_50.jpg",
    },
  ];
  return (
    <div className="bg-white dark:bg-gray-800 flex relative z-20 items-center overflow-hidden">
      <div className="container mx-auto px-6 flex relative py-16">
        <div className="sm:w-2/3 lg:w-2/5 flex flex-col relative z-20">
          <span className="w-20 h-2 bg-gray-800 dark:bg-white mb-12"></span>
          <h1 className="font-bebas-neue uppercase text-6xl sm:text-8xl font-black flex flex-col leading-none dark:text-white text-gray-800">
            Grab
            <span className="text-5xl sm:text-7xl">it now</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-700 dark:text-white mt-5">
            The Click.it Store has one of the largest selections of fashionable
            and trending products.
          </p>
          <div className="flex mt-8">
            <a
              href="/products"
              className="uppercase py-2 px-4 rounded-lg bg-gray-800 border-2 border-transparent text-white text-md mr-4 hover:bg-gray-700"
            >
              Shop Now
            </a>
          </div>
        </div>
        <div className="hidden sm:block sm:w-1/3 md:w-4/5 m-auto lg:w-3/5 relative">
          <Carousel
            autoPlay
            infiniteLoop
            showStatus={false}
            showIndicators={false}
            showThumbs={false}
            interval={5000}
          >
            {images.map((image) => (
              <div key={image.id}>
                <img
                  loading="lazy"
                  src={image.src}
                  alt={image.id}
                  className="max-w-md sm:max-w-sm md:max-w-md  lg:max-w-xl  m-auto"
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export default Banner;
