var multer = require("multer");
var path = require("path");
var fs = require("fs");
var crypto = require("crypto");

var UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "assignments");

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

var ALLOWED_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".txt", ".csv", ".zip", ".rar",
  ".png", ".jpg", ".jpeg", ".gif", ".webp",
];

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_ROOT);
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname).toLowerCase();
    var uniqueSuffix = Date.now() + "-" + crypto.randomBytes(8).toString("hex");
    cb(null, uniqueSuffix + ext);
  },
});

function fileFilter(req, file, cb) {
  var ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
    return cb(new Error("File type " + ext + " is not allowed."));
  }
  cb(null, true);
}

var upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

module.exports = upload;