const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const PDFDocument = require("pdfkit");

const ID_CARD_WIDTH = 280; // Width of the ID card
const ID_CARD_HEIGHT = 170; // Height of the ID card
const X_MARGIN = 15; // Left and right margin
const Y_MARGIN = 10; // Top and bottom margin
const X_SPACE = 14; // Space between columns
const Y_SPACE = 14; // Space between rows

const processRowsChunk = async (rows) => {
  // Group rows by faculty
  const faculties = {};
  rows.forEach((row) => {
    const faculty = row.FACULTY;
    if (!faculties[faculty]) {
      faculties[faculty] = [];
    }
    faculties[faculty].push(row);
  });

  // Process each faculty separately
  for (const faculty in faculties) {
    await processFaculty(faculties[faculty], faculty);
  }
};

const drawRoundedImage = (doc, imagePath, x, y, width, height, radius) => {
  // Save the current graphics state
  doc.save();

  // Draw a rounded rectangle path
  doc
    .roundedRect(x, y, width, height, radius)
    .clip() // Set the clipping region to the rounded rectangle
    .image(imagePath, x, y, { width, height }) // Draw the image inside the clipped region
    .restore(); // Restore the graphics state
};

const processFaculty = async (rows, faculty) => {
  const doc = new PDFDocument({ layout: "portrait" });
  const pdfPath = path.join(__dirname, `../Generated/${faculty}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  for (let i = 0; i < rows.length; i += 8) {
    if (i > 0) {
      doc.addPage();
    }
    // Each page will have 2 columns and 4 rows of ID cards
    await processRow(doc, rows[i], X_MARGIN, Y_MARGIN, faculty); // Top-left ID card
    if (rows[i + 1])
      await processRow(
        doc,
        rows[i + 1],
        X_MARGIN + ID_CARD_WIDTH + X_SPACE,
        Y_MARGIN,
        faculty
      ); // Top-right ID card
    if (rows[i + 2])
      await processRow(
        doc,
        rows[i + 2],
        X_MARGIN,
        Y_MARGIN + ID_CARD_HEIGHT + Y_SPACE,
        faculty
      ); // Middle-left ID card
    if (rows[i + 3])
      await processRow(
        doc,
        rows[i + 3],
        X_MARGIN + ID_CARD_WIDTH + X_SPACE,
        Y_MARGIN + ID_CARD_HEIGHT + Y_SPACE,
        faculty
      ); // Middle-right ID card
    if (rows[i + 4])
      await processRow(
        doc,
        rows[i + 4],
        X_MARGIN,
        Y_MARGIN + 2 * (ID_CARD_HEIGHT + Y_SPACE),
        faculty
      ); // Bottom-left ID card
    if (rows[i + 5])
      await processRow(
        doc,
        rows[i + 5],
        X_MARGIN + ID_CARD_WIDTH + X_SPACE,
        Y_MARGIN + 2 * (ID_CARD_HEIGHT + Y_SPACE),
        faculty
      ); // Bottom-right ID card
    if (rows[i + 6])
      await processRow(
        doc,
        rows[i + 6],
        X_MARGIN,
        Y_MARGIN + 3 * (ID_CARD_HEIGHT + Y_SPACE),
        faculty
      ); // Bottom-left ID card
    if (rows[i + 7])
      await processRow(
        doc,
        rows[i + 7],
        X_MARGIN + ID_CARD_WIDTH + X_SPACE,
        Y_MARGIN + 3 * (ID_CARD_HEIGHT + Y_SPACE),
        faculty
      ); // Bottom-right ID card
  }

  doc.end();
};

const processRow = async (doc, row, x, y, faculty) => {
  const {
    REG_NUMBER,
    SURNAME,
    OTHERNAME,
    DEPARTMENT,
    EXPIRE_DATE,
    NEXT_OF_KIN_PHONE,
    PICTURE,
  } = row;

  // Determine the image path based on the faculty
  let imagePath;
  switch (faculty.toLowerCase()) {
    case "science":
      imagePath = path.join(__dirname, "../../public/images/SCIENCE.png");
      break;
    case "arts":
      imagePath = path.join(__dirname, "../../public/images/ARTS.png");
      break;
    case "education":
      imagePath = path.join(__dirname, "../../public/images/EDUCATION.png");
      break;
    default:
      imagePath = path.join(__dirname, "../../public/images/ID_CARD_GSU.png");
  }

  // Draw the faculty template image
  doc.image(imagePath, x, y, { width: ID_CARD_WIDTH, height: ID_CARD_HEIGHT });

  // Path to the student's picture
  const studentImagePath = path.join(
    __dirname,
    `../../public/students_picture/${PICTURE}`
  );

  // Draw the student's picture with rounded corners
  drawRoundedImage(doc, studentImagePath, x + 205, y + 65, 62, 69, 5);

  // Customizable font sizes for each field
  const fontSize = {
    name: 9,
    regNumber: 9,
    department: 9,
    phone: 9,
    expireDate: 6,
  };

  // Adjust these values based on your template layout
  doc
    .fontSize(fontSize.name)
    .font("Helvetica-Bold")
    .fillColor("black")
    .text(`${SURNAME} ${OTHERNAME}`, x + 45, y + 73);

  doc
    .fontSize(fontSize.regNumber)
    .font("Helvetica-Bold")
    .fillColor("black")
    .text(`${REG_NUMBER}`, x + 55, y + 90);

  doc
    .fontSize(fontSize.department)
    .font("Helvetica-Bold")
    .fillColor("black")
    .text(`${DEPARTMENT.toUpperCase()}`, x + 72, y + 109);

  doc
    .fontSize(fontSize.phone)
    .font("Helvetica-Bold")
    .fillColor("black")
    .text(`${NEXT_OF_KIN_PHONE}`, x + 115, y + 128);

  doc
    .fontSize(fontSize.expireDate)
    .font("Helvetica-Bold")
    .fillColor("white")
    .text(`${EXPIRE_DATE}`, x + 225, y + 147, { width: 50 });
};

const uploadStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const fileExtension = path.extname(filePath).toLowerCase();
  const mimeTypes = require("mime-types");
  const fileMime = mimeTypes.lookup(filePath);

  if (fileMime !== "text/csv" || fileExtension !== ".csv") {
    return res
      .status(400)
      .json({ error: "Unsupported file type, only CSV files are allowed" });
  }

  const rows = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (row) => {
      rows.push(row);
    })
    .on("end", async () => {
      try {
        await processRowsChunk(rows);
        res
          .status(200)
          .json({ message: "File uploaded and processed successfully" });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error processing CSV file" });
      } finally {
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
        });
      }
    })
    .on("error", (error) => {
      console.error("Error:", error);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error("Failed to delete file:", unlinkErr);
      });
      res.status(500).json({ error: "Error processing CSV file" });
    });
};

module.exports = { uploadStudents };
