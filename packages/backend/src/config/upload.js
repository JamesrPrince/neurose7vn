const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const profileUploadsDir = path.join(uploadsDir, "profiles");
const projectUploadsDir = path.join(uploadsDir, "projects");

[uploadsDir, profileUploadsDir, projectUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// General file upload error handler middleware
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File is too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      status: "error",
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
  next();
};

// Configure multer storage for project attachments
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "project-" + uniqueSuffix + ext);
  },
});

// Project file upload middleware
exports.uploadProjectFiles = multer({
  storage: projectStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for project files
  fileFilter: (req, file, cb) => {
    // Allow various file types for projects
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip|rar|txt|md/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    }
    cb(
      new Error(
        "Invalid file type. Allowed types: images, PDFs, Office documents, zip, text files"
      )
    );
  },
}).array("projectFiles", 5); // Allow up to 5 files

module.exports = {
  upload,
  handleUploadError,
};
