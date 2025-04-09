const Publication = require("../../../models/Publication");
const { verifyToken, authenticateAdmin } = require("../../../middleware/auth");


const express = require("express");
const router = express.Router();

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!Publication) {
      throw new Error("Модель Publication не определена.");
    }
    const id = req.params.id;
    const publication = await Publication.findById(id);
    if (publication.iin !== req.user.iin && req.user.role !== 'admin') {
      return res.status(403).json({ message: "FORBIDDEN" });
    }

    await Publication.deleteOne({ _id: id});
    return res.status(200).json({ success: id });
  } catch (error) {
    console.error("Ошибка при получении профиля пользователя:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});


router.get("/", verifyToken, authenticateAdmin, async (req, res) => {
  try {
    if (!Publication) {
      throw new Error("Модель Publication не определена.");
    }
    const { school, publicationType, year, name } = req.query;

    const filter = {};

    if (publicationType) filter.publicationType = publicationType;
    if (year) filter.year = year;
    // if (name) {
    //   // Use a regular expression to match the last word in the school name
    //   filter["userId.fullName"] = { 
    //     $regex: new RegExp(`\\b${name}\\b`, "i") // match the last word (case-insensitive)
    //   };
    // }

    const userFilter = {}
    if (school) {
      userFilter.higherSchool = school
    }
    // if (name) {
    //   userFilter.fullName = name
    // }

    // Find publications and populate the userId with the user data
    const publications = await Publication.find(filter)
      .populate({
        path: "userId", // Populate the user data
        match: userFilter, // If school is provided, filter the user by school
      })
      .exec();
      if (Object.keys(userFilter).length > 0) {
        console.log(school)
        const filteredPublications = publications.filter(pub => pub.userId !== null && pub.userId !== undefined);
        // console.log(publications[0].userId)
        return res.status(200).json(filteredPublications);

      }
    return res.status(200).json(publications);
  } catch (error) {
    console.error("Ошибка при получении профиля пользователя:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});
router.patch("/:id",verifyToken, async (req, res) => {
  try {
    if (!Publication) {
      throw new Error("Модель Publication не определена.");
    }
    const id = req.params.id;
    const publication = await Publication.findById(id);
    // if (publication.iin !== req.user.iin) { //without admin
      if (publication.iin !== req.user.iin && req.user.role !== 'admin') { // with admin
        return res.status(403).json({ message: "FORBIDDEN" });
    }
   const updateObject = req.body;
    await Publication.updateOne({ _id: id}, updateObject)
    return res.status(200).json({ success: id });
  } catch (error) {
    console.error("Ошибка при получении профиля пользователя:", error);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});
module.exports = router;

