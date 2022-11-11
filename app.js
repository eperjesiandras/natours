const path = require("path"); /*path names correcter*/
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
/*see helmet documentation on github*/
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const app = express();

app.enable("trust proxy");
/*secure: req.secure || req.headers["x-forwarded-proto"] === "https", works only this way, if we enable trust proxy*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️VIEW ENGINE*/
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
/*it corrects the path names automatically*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️GLOBAL MIDDLEWARES*/

/*🗃️SERVING STATIC FILES*/
/*- all static assets (like css stylesheet, favicon etc.) are served from the public folder*/
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src  'self' api.mapbox.com",
    "script-src-elem 'self' api.mapbox.com"
  );
  next();
});

/*🗃️SECURITY HTTP HEADERS*/
//app.use(helmet());
/*works only until we try to use mapbox...*/
// app.use(
//   helmet({
//     crossOriginEmbedderPolicy: false,
//     crossOriginResourcePolicy: {
//       allowOrigins: ["*"],
//     },
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["*"],
//         scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"],
//       },
//     },
//   })
// );
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  "https://unpkg.com/",
  "https://tile.openstreetmap.org",
  "https://js.stripe.com",
  "https://m.stripe.network",
];
const styleSrcUrls = ["https://unpkg.com/", "https://tile.openstreetmap.org", "https://fonts.googleapis.com/"];
const connectSrcUrls = ["https://unpkg.com", "https://tile.openstreetmap.org", "https://*.stripe.com"];
const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", "https:"],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);
// const scriptSrcUrls = [
//   "https://unpkg.com/",
//   "https://tile.openstreetmap.org",
//   "https://js.stripe.com",
//   "https://m.stripe.network",
//   "https://*.cloudflare.com",
// ];
// const styleSrcUrls = [
//   "mapbox://styles/05/cl9aklahz000k14lbb1nulzvi",
//   /*"https://tile.openstreetmap.org",*/ "https://fonts.googleapis.com/",
// ];
// const connectSrcUrls = [
//   "mapbox://styles/05/cl9aklahz000k14lbb1nulzvi",
//   /*"https://tile.openstreetmap.org",*/
//   "https://*.stripe.com",
//   "https://bundle.js:*",
//   "ws://127.0.0.1:*/",
// ];
// const fontSrcUrls = ["fonts.googleapis.com", "fonts.gstatic.com"];

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", "data:", "blob:", "https:", "ws:"],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'" /*...fontSrcUrls*/],
//       scriptSrc: ["'self'", "https:", "http:", "blob:" /*...scriptSrcUrls*/],
//       frameSrc: ["'self'", "https://js.stripe.com"],
//       objectSrc: ["'none'"],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", "blob:", "https://m.stripe.network"],
//       childSrc: ["'self'", "blob:"],
//       imgSrc: ["'self'", "blob:", "data:", "https:"],
//       formAction: ["'self'"],
//       connectSrc: ["'self'", "'unsafe-inline'", "data:", "blob:", ...connectSrcUrls],
//       upgradeInsecureRequests: [],
//     },
//   })
// );
/*🗃️DEVELOPMENT LOGGER*/
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
/*should run first here*/
/*🗃️REQUEST RATE LIMITER*/
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);

/*🗃️BODY PARSER, READS DATA FROM BODY INTO REQ.BODY*/
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

/*🗃️DATA SANITIZATION AGAINST NoSQL QUERY INJECTION*/
app.use(mongoSanitize());

/*🗃️DATA SANITIZATION AGAINST XSS ATACKS*/
app.use(xss());

/*🗃️PREVENT PARAMETER POLLUTION*/
app.use(
  hpp({
    whitelist: ["duration", "ratingsQuantity", "ratingsAverage", "maxGroupSize", "difficulty", "price"],
  })
);

app.use(compression());

/*🗃️TEST MIDDLEWARE*/
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  //console.log(req.cookies);
  next();
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*🖥️ROUTES*/
app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
