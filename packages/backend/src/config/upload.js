const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid-originalname
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Allow images, documents, PDFs, and common development files
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    // Development files
    "text/javascript",
    "application/json",
    "text/html",
    "text/css",
    "application/xml",
    "text/xml",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Configure multer with our storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
    files: 5, // Maximum 5 files per upload
  },
});

// Middleware for handling file upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File too large. Maximum size is 10MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        status: "error",
        message: "Too many files. Maximum is 5 files per upload",
      });
    }
    return res.status(400).json({
      status: "error",
      message: "File upload error",
    });
  }

  if (err.message === "Invalid file type") {
    return res.status(400).json({
      status: "error",
      message: "Invalid file type",
    });
  }

  next(err);
};

module.exports = {
  upload,
  handleUploadError,
};
