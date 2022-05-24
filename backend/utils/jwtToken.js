// Creating token and saving in cookie

const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  // Options for cookies

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 //Coverting to days
    ),

    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};

module.exports = sendToken;
