const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (res, file, cb) => {
    const name = Date.now().toString() + "_" + file.originalname;
    cb(null, name);
    file.originalname = name;
    console.log(file);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
