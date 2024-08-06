const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadStudents } = require("../Controllers/students");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../Uploads/"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/upload-students", upload.single("file"), uploadStudents);

module.exports = router;
