import React from "react";

function AboutUs() {
  return (
    <>
      <div class="flex items-center h-96 w-full justify-center">
        <div class="max-w-xs">
          <div class="bg-white shadow-xl rounded-lg py-1">
            <div class="photo-wrapper p-2">
              <img
                class="w-20 h-20 rounded-full mx-auto"
                src="Pic-JK-min.jpg"
                alt="John Doe"
              />
            </div>
            <div class="p-2">
              <h3 class="text-center text-xl text-gray-900 font-medium leading-8">
                Jagkaran Singh
              </h3>
              <div class="text-center text-gray-400 text-xs font-semibold">
                <p>SFCC consultant & React Enthusiast</p>
              </div>
              <table class="text-xs my-3">
                <tbody>
                  <tr>
                    <td class="px-2 py-2 text-gray-500 font-semibold">
                      Address
                    </td>
                    <td class="px-2 py-2">Schulstr. 13, Uttenreuth, Germany</td>
                  </tr>
                  <tr>
                    <td class="px-2 py-2 text-gray-500 font-semibold">Phone</td>
                    <td class="px-2 py-2">+49 151 68646588</td>
                  </tr>
                  <tr>
                    <td class="px-2 py-2 text-gray-500 font-semibold">Email</td>
                    <td class="px-2 py-2">jagkarans43@gmail.com</td>
                  </tr>
                </tbody>
              </table>

              <div class="text-center my-3">
                <a
                  class="text-xs text-indigo-500 italic hover:underline hover:text-indigo-600 font-medium"
                  href="https://www.linkedin.com/in/jagkaran-singh/"
                >
                  View Profile
                </a>
              </div>
            </div>
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
