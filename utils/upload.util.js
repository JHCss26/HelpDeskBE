// utils/upload.util.js
const multer = require('multer');
const path = require('path');

// Storage engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|gif|bmp|svg|pdf|doc|docx|xls|xlsx|xlsm|csv|txt|zip/;

  const extname = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('❌ Images and Documents Only!');
  }
}

const upload = multer({
  limits: { fileSize:  1 * 1024 * 1024 * 1024, }, // 1MB limit
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = { upload };
