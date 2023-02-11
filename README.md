# Mern Stack Ecom App

This is a MERN stack app created for learning purpose. This app is rolled out in MVP mode with bare minimum functionality. However, i will try to add more functionalties over the period of time 😎

## Demo

https://mern-ecommerce-app-91py.onrender.com

## Run Locally

Clone the project

```bash
  git clone https://github.com/jagkaran/mern-ecommerce.git
```

Install Backend dependencies

```bash
  yarn
```

Install Frontend dependencies

```bash
  cd frontend
  yarn
```

Start the server

```bash
  yarn start
```

## Environment Variables

To run this project, make sure to create a config.env file in backend/config directory and add appropriate variables in order to use the app.

`PORT` `DB_URI` `STRIPE_API_KEY` `STRIPE_SECRET_KEY` `JWT_SECRET` `JWT_EXPIRE` `COOKIE_EXPIRE` `SMTP_SERVICE` `SMTP_MAIL` `SMTP_PASSWORD` `SMTP_HOST` `SMTP_PORT` `CLOUDINARY_NAME` `CLOUDINARY_API_KEY` `CLOUDINARY_API_SECRET` `STRIPE_API_KEY` `STRIPE_SECRET_KEY`

## Tech Stack

**Client:** React, Redux, Tailwind CSS, MUI v5

**Server:** Node, Express

**Database:** Mongo DB

**Media Hosting:** Cloudinary

**Payment Processor:** Stripe

## Features

#### AS a USER

- You can browse through the list of products made available by your admin.
- Search for a specific product with our global search functionality.
- Filter through the list of products based on price, category and ratings.
- Submit and modify your ratings and reviews for a selected product.
- Add selected items to your cart.
- Checkout your cart and place and order with test stripe card payment.
- View all the orders created by you.

#### AS an ADMIN

- You can do all the things as a normal user would do.
- Additonally, you have access to view Dashboard to see overall sales and manage ecommerce entities.
- Create or Modify or Delete a Product by assigning multiple properties to it. For example: Name, Description, Price, Images, Stock etc.
- Modify a user role from Admin to User and vice versa. Also you can delete a user if needed.
- Process an order by changing the status to shipping and delivered. Aurtomatic Stock level deduction happens during this step. Also you can delete an order if needed.
- Access to see all the reviews created by users and delete them if needed.

## Known Issues

- My orders Load more/View all option is not available atm.
- Payment's page has frontend console errors.
- Reviews doesn't support the created date atm.
- Form Validations are missing atm.
- You might face responsiveness issues with mobile.

## Authors

- Github [@jagkaran](https://github.com/jagkaran)
- Linkedin [@jagkaran-singh](https://www.linkedin.com/in/jagkaran-singh/)
