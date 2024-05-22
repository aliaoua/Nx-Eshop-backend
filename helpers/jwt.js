const { expressjwt: jwt } = require("express-jwt"); // Use destructuring

function authJwt() {
  const secret = process.env.secret;

  return jwt({
    secret,
    algorithms: ["HS256"],
    isRevoked: async function isRevoked(req, token) {
      if (token.payload.isAdmin == false) {
        return true;
      }

      return false;
    },
  }).unless({
    path: [
      { url: /^\/public\/uploads\/(.*)/, methods: ["GET"] },
      // Combine product and category paths into a single regular expression
      { url: /^\/api\/v1\/(products|categories)(.*)/, methods: ["GET"] },
      { url: /\/api\/v1\/orders(.*)/, methods: ["GET", "OPTIONS", "POST"] },

      // Login and register paths
      "/api/v1/users/login",
      "/api/v1/register",
      // { url: /(.*)/ },
    ],
  });
}

module.exports = authJwt;

// const jwt = require("jsonwebtoken");

// const verifyToken = (req, res, next) => {
//   console.log(req.method);

//   if (
//     (req.path === "/api/v1/users/login" && req.method === "POST") ||
//     (req.path === "/api/v1/users/register" && req.method === "POST") ||
//     (req.path.startsWith("/api/v1/products") && req.method === "GET")
//   ) {
//     return next(); // Skip token verification for login route
//   }
//   // Specify the algorithm type used for JWT verification (e.g., HS256)
//   const algorithm = "HS256";
//   const secret = process.env.secret;

//   const token = req.headers.authorization;

//   if (!token || !token.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "The user is not authorized" });
//   }

//   jwt.verify(
//     token.split(" ")[1],
//     secret,
//     { algorithms: [algorithm] },
//     (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ error: "ValidationError" });
//       }
//       req.user = decoded;
//       next(); // Call the next middleware
//     }
//   );
// };
// module.exports = verifyToken;
