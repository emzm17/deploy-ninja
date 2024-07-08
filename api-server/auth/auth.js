const jwt = require('jsonwebtoken');
const SECRET = 'MICKY';

const auth = function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;
    if (authorizationHeader) {
      const token = authorizationHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          message: "Unauthorized user, token missing"
        });
      }

      try {
        const user = jwt.verify(token, SECRET);
        console.log(user);
        if (user) {
          req.user_id = user.id;
          next();
        } else {
          return res.status(401).json({
            message: "Unauthorized user, token invalid"
          });
        }
      } catch (error) {
        return res.status(401).json({
          message: "Access denied",
          error: error.message
        });
      }
    } else {
      return res.status(401).json({
        message: "Unauthorized user, authorization header missing"
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = auth;
