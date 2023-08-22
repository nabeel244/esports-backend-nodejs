// Core modules
const path = require("path");
const http = require("http");
const fs = require("fs");

// Third party packages/modules
const express = require("express");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const ExpressMongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const socketio = require("socket.io");
require("./src/config/Oauth");
require("dotenv").config();

// Custom Modules
const { connectMongo } = require("./src/config/db");
const {
  ErrorHandler,
  globalErrorHandler,
} = require("./src/utils/errorHandlers");

// Controllers
const orderController = require("./src/controllers/orderController");
const authController = require("./src/controllers/authController");
const asyncHandler = require("./src/utils/asyncHandler");

const User = require("./src/models/userModel");
// Routes
const authRoutes = require("./src/routes/authRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const tournamentRoutes = require("./src/routes/tournamentRoutes");
const newsRoutes = require("./src/routes/newLetterRoutes");
const userRoutes = require("./src/routes/userRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const leagueRoutes = require("./src/routes/leagueRoutes");
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const blogRoutes = require("./src/routes/blogRoutes");
const teamRoutes = require("./src/routes/teamRoutes.js");
const pokemonRoutes = require("./src/routes/pokemonsRoutes");
const seasonRoutes = require("./src/routes/seasonRoutes");
const fileUpload = require("./src/routes/fileUploadRoutes.js");
const statsRouter = require("./src/routes/statRoutes");

// config Objects and initializations

const app = express();
connectMongo();

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: "Too many requests from same IP, try again in an hour",
});

const corOpts = {
  origin: `${process.env.FRONTEND_URL}`,
  credentials: true,
};

const logStream = fs.createWriteStream(path.join(__dirname, "logs.log"), {
  flags: "a",
});

// app.enable("trust proxy");
app.use(morgan("dev", logStream));
app.use(helmet());
// app.use(limiter);
app.use(
  session({
    secret: process.env.JWT_SEC,
    saveUninitialized: true,
    resave: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", `${process.env.FRONTEND_URL}`);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Server static files and view engines setting.
app.use(express.static(path.resolve(__dirname, "public")));
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// Stripe webhooks
const expressRaw = express.raw({ type: "application/json" });
app.post("/checkout-webhook", expressRaw, orderController.webhookCheckout);

// Parse incoming req/res bodies and cors
app.use(express.json({ limit: "5kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cookieParser());
app.use(passport.initialize());
app.use(cors(corOpts));
app.options("*", cors());
app.use(ExpressMongoSanitize());
app.use(compression());

app.get("/", (req, res, next) => {
  res.json("Home page");
});

app.get("/success", (req, res, next) => {
  res.json(
    "Thank you, Your Order Completed Successfully, please check your inbox!"
  );
});

app.use("/auth", authRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/pokemons", pokemonRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/newsletter", newsRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/tournaments", tournamentRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/leagues", leagueRoutes);
app.use("/api/v1/seasons", seasonRoutes);
app.use("/api/v1/uploads", fileUpload);
app.use("/api/v1/stats", statsRouter);

// handle invalid routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`URL ${req.originalUrl} not found on the server`, 404));
});

app.use(globalErrorHandler);

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Catch unhandledrejction errors
process.on("unhandledrejection", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Gracefully Shutdown the server.
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  app.close(() => {
    console.log("Process terminated!");
  });
});

const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

// function handleOnlineUsers() {}

let onlineUsers = [];
io.on("connection", (socket) => {
  // This userId parameter will come from frontend pass userId to this event.
  console.log("Connection Established!");
  socket.on("newUser", (userId) => {
    if (!onlineUsers.some((user) => user.userId !== userId)) {
      onlineUsers.push({ userId: userId, socketId: socket.id });
      console.log(`New user: `, onlineUsers);
    }
    io.emit("get-users", onlineUsers);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("user disconnected", onlineUsers);
    // send all online users to all users
    io.emit("get-users", onlineUsers);
  });

  socket.on("offline", () => {
    // remove user from active users
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("user is offline", onlineUsers);
    // boardcast offline users
    io.emit("get-users", onlineUsers);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, console.log(`App is running on ${PORT}`));
