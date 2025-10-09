const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const terminologyRoutes = require("./routes/terminology");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const regenerateRouter = require("./routes/regenerateRoute.js");
const scanRoute = require("./routes/scanRoute.js");

// Middleware
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

// Ensure uploads directory exists at runtime
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}
 
app.use(cors(corsOptions));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () =>
  console.log("✅ Connected to MongoDB")
);

// Routes
app.get("/", (req, res) => {
  res.send("AyuSandhi Terminology API is running");
});
app.use("/api/v1/terminology", terminologyRoutes);
app.use("/api/v2", regenerateRouter);
app.use("/", scanRoute);

// Health route
app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));