const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken, authenticateUser } = require("../../../middleware/auth");
const Publication = require("../../../models/Publication");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../../public/uploads/publications");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Директория создана: ${uploadDir}`);
}

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/publications/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".pdf") {
      return cb(new Error("Файл должен быть формата PDF"));
    }
    cb(null, true);
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "authors", maxCount: 1 },
  { name: "title", maxCount: 1 },
  { name: "year", maxCount: 1 },
  { name: "output", maxCount: 1 },
  { name: "doi", maxCount: 1 },
  { name: "isbn", maxCount: 1 },
  { name: "scopus", maxCount: 1 },
  { name: "wos", maxCount: 1 },
  { name: "publicationType", maxCount: 1 },
]);

router.post("/upload", verifyToken, authenticateUser, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Ошибка загрузки файла:", err.message);
      return res.status(400).json({ message: err.message });
    }

    const {
      authors,
      title,
      year,
      output,
      doi,
      isbn,
      scopus,
      wos,
      publicationType,
    } = req.body;

    if (!authors || !title || !year || !output || !publicationType) {
      return res
        .status(400)
        .json({ message: "Все обязательные поля должны быть заполнены." });
    }
    
    try {
      
      const newPublication = new Publication({
        userId: req.user.id,
        iin: req.user.iin,
        authors: authors,
        title,
        year,
        output,
        doi: doi || null,
        isbn: isbn || null,
        scopus: scopus === "true",
        wos: wos === "true",
        publicationType,
        file: req.files["file"]
          ? `public/uploads/publications/${req.files["file"][0].filename}`
          : null,
      });
      console.log('\n\n\n')
      console.log(req.user.id)
      console.log('\n\n\n')

      const savedPublication = await newPublication.save();
      
      console.log("Сохранённая публикация:", savedPublication);

      return res.status(201).json(savedPublication);
    } catch (error) {
      // console.log(error);
      // console.error("Ошибка сохранения публикации:", error);
      return res
        .status(500)
        .json({ message: "Ошибка при сохранении публикации." });
    }
  });
});

// PATCH для multipart/form-data (с файлом)
router.patch("/upload/:id", verifyToken, authenticateUser, (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  console.log('PATCH endpoint called, content-type:', contentType);
  if (contentType.includes('multipart/form-data')) {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Ошибка загрузки файла:", err.message);
        return res.status(400).json({ message: err.message });
      }
      try {
        const { id } = req.params;
        console.log('PATCH req.body:', req.body);
        console.log('PATCH req.files:', req.files);
        const updateData = {};
        for (const key in req.body) {
          updateData[key] = Array.isArray(req.body[key]) ? req.body[key][0] : req.body[key];
        }
        if (req.files && req.files["file"]) {
          updateData.file = `public/uploads/publications/${req.files["file"][0].filename}`;
        }
        if (typeof updateData.scopus !== 'undefined') updateData.scopus = updateData.scopus === 'true' || updateData.scopus === true;
        if (typeof updateData.wos !== 'undefined') updateData.wos = updateData.wos === 'true' || updateData.wos === true;
        console.log('PATCH updateData:', updateData);
        const updated = await Publication.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
          return res.status(404).json({ message: "Публикация не найдена" });
        }
        res.json(updated);
      } catch (error) {
        console.error("Ошибка при обновлении публикации:", error);
        res.status(500).json({ message: "Ошибка при обновлении публикации" });
      }
    });
  } else {
    next();
  }
});

// PATCH для application/json (без файла)
router.patch("/upload/:id", verifyToken, authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PATCH (json) req.body:', req.body);
    const updateData = req.body;
    if (typeof updateData.scopus !== 'undefined') updateData.scopus = updateData.scopus === 'true' || updateData.scopus === true;
    if (typeof updateData.wos !== 'undefined') updateData.wos = updateData.wos === 'true' || updateData.wos === true;
    console.log('PATCH (json) updateData:', updateData);
    const updated = await Publication.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Публикация не найдена" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Ошибка при обновлении публикации (json):", error);
    res.status(500).json({ message: "Ошибка при обновлении публикации" });
  }
});

module.exports = router;
