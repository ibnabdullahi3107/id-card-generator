const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1/students-id-cards", require("./Routes/student_idcard"));

app.use(require("./Middlewares/not-found"));
app.use(require("./Middlewares/error-handler"));

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
