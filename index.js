const express = require("express");
const mongoose = require("mongoose");
const terminologyRoutes = require("./routes/terminology");
const cors = require("cors");
const app = express();
// Middleware
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};
 
app.use(cors(corsOptions));

app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb+srv://efree561:wOenngG3EGowANbY@cluster0.g98bv.mongodb.net/terminology?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("open", () =>
  console.log("✅ Connected to MongoDB")
);

app.get("/", (req, res) => {
  res.send("AyuSandhi Terminology API is running");
});

// Routes
app.use("/api/v1/terminology", terminologyRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));