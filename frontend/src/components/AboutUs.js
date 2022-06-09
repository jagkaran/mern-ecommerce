import React from "react";

function AboutUs() {
  return (
    <>
      <div class="relative mt-14 flex items-center h-96 w-full justify-center">
        <div class="text-center mb-4 absolute -top-10 right-1/2 transform translate-x-1/2">
          <a href="#" class="block relative">
            <img
              alt="profil"
              src="Pic-JK-min.jpg"
              class="mx-auto object-cover rounded-lg h-40 w-40  border-2 border-white dark:border-gray-800"
            />
          </a>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow px-8 py-4 pt-24">
          <div class="text-center">
            <p class="text-2xl text-gray-800 dark:text-white">Jagkaran Singh</p>
            <p class="text-xl text-gray-500 dark:text-gray-200 font-light">
              SFCC consultant & React Enthusiast
            </p>
            <p class="text-md text-gray-500 w-60 dark:text-gray-400 mx-auto py-4 font-light">
              jagkarans43@gmail.com
            </p>
          </div>
          <div class="pt-8 flex border-t border-gray-200 w-40 mx-auto text-gray-500 items-center justify-center">
            <a href="https://www.linkedin.com/in/jagkaran-singh/">
              <svg
                width="30"
                height="30"
                fill="currentColor"
                class="text-xl hover:text-linkdein_blue dark:hover:text-white transition-colors duration-200"
                viewBox="0 0 1792 1792"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M477 625v991h-330v-991h330zm21-306q1 73-50.5 122t-135.5 49h-2q-82 0-132-49t-50-122q0-74 51.5-122.5t134.5-48.5 133 48.5 51 122.5zm1166 729v568h-329v-530q0-105-40.5-164.5t-126.5-59.5q-63 0-105.5 34.5t-63.5 85.5q-11 30-11 81v553h-329q2-399 2-647t-1-296l-1-48h329v144h-2q20-32 41-56t56.5-52 87-43.5 114.5-15.5q171 0 275 113.5t104 332.5z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="py-20 px-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row ">
          <h2 className="mr-8 w-full md:w-1/3 text-3xl font-bold leading-9 ">
            About this app 💻
          </h2>
          <dl className="w-full md:w-2/3">
            <dt className="mb-4">
              <h3 className="text-xl font-semibold">
                What is the purpose of this app?
              </h3>
            </dt>
            <dd className="mb-10">
              <p>
                This is a MERN stack app created for learning purpose. This app
                is rolled out in MVP mode with bare minimum functionality.
                However, i will try to add more functionalties over the period
                of time 😎
              </p>
            </dd>
            <dt className="mb-4">
              <h3 className="text-xl font-semibold">
                What is the Technology Stack?
              </h3>
            </dt>
            <dd className="mb-10">
              <p>
                Backend:{" "}
                <a href="https://nodejs.org/en/">
                  <u>Node.js</u>
                </a>{" "}
                and{" "}
                <a href="https://expressjs.com/">
                  <u>Express.js</u>
                </a>
              </p>
              <p>
                Frontend:{" "}
                <a href="https://reactjs.org/">
                  <u>React.js and Redux</u>
                </a>
              </p>
              <p>
                Database:{" "}
                <a href="https://www.mongodb.com/">
                  <u>Mongo DB</u>
                </a>
              </p>
              <p>
                Styling:{" "}
                <a href="https://mui.com/">
                  <u>MUI v5</u>
                </a>{" "}
                and{" "}
                <a href="https://tailwindcss.com/">
                  <u>Tailwind CSS</u>
                </a>
              </p>
              <p>
                Image Hosting:{" "}
                <a href="https://cloudinary.com/">
                  <u>Cloudinary</u>
                </a>
              </p>
              <p>
                Payment Processor:{" "}
                <a href="https://stripe.com/en-de">
                  <u>Stripe</u>
                </a>
              </p>
            </dd>
            <dt className="mb-4">
              <h3 className="text-xl font-semibold">
                What is the functionality of this app?
              </h3>
            </dt>
            <dd className="mb-10">
              <p className="font-semibold">
                <u>AS a USER:</u>
              </p>

              <p>
                - You can browse through the list of products made available by
                your admin.
              </p>

              <p>
                - Search for a specific product with our global search
                functionality.
              </p>

              <p>
                - Filter through the list of products based on price, category
                and ratings.
              </p>

              <p>
                - Submit and modify your ratings and reviews for a selected
                product.
              </p>

              <p>- Add selected items to your cart.</p>
              <p>
                - Checkout your cart and place and order with test stripe card
                payment.
              </p>
              <p>- View all the orders created by you.</p>

              <p className="font-semibold mt-5">
                <u>AS an ADMIN:</u>
              </p>

              <p>- You can do all the things as a normal user would do.</p>

              <p>
                - Additonally, you have access to view Dashboard to see overall
                sales and manage ecommerce entities.
              </p>

              <p>
                - Create or Modify or Delete a Product by assigning multiple
                properties to it. For example: Name, Description, Price, Images,
                Stock etc.
              </p>

              <p>
                - Modify a user role from <i>Admin</i> to <i>User</i> and vice
                versa. Also you can delete a user if needed.
              </p>
              <p>
                - Process an order by changing the status to shipping and
                delivered. Aurtomatic Stock level deduction happens during this
                step. Also you can delete an order if needed.
              </p>
              <p>
                - Access to see all the reviews created by users and delete them
                if needed.
              </p>
            </dd>

            <dt className="mb-4">
              <h3 className="text-xl font-semibold">Known Issues?</h3>
            </dt>
            <dd className="mb-10">
              <p>- My orders Load more/View all option is not available atm.</p>

              <p>- Payment's page has frontend console errors.</p>

              <p>- Reviews doesn't support the created date atm.</p>

              <p>- Form Validations are missing atm.</p>

              <p>- You might face responsiveness issues with mobile.</p>
            </dd>
          </dl>
        </div>
      </div>
    </>
  );
}

export default AboutUs;
