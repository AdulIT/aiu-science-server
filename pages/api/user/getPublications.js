const Publication = require('../../../models/Publication');
const { verifyToken, authenticateAdmin } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  const { iin, publicationType } = req.query;

  try {
    verifyToken(req, res, async () => {
      const {iin, school, publicationType, year, name } = req.query;

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
    const publications = await Publication.find({iin,...filter})
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
    });
  } catch (error) {
    console.error('Ошибка при авторизации или аутентификации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// app.get('/api/user/:iin/publications', async (req, res) => {
//     const { iin } = req.params;
//     try {
//       const publications = await Publication.find({ iin });
//       res.json({ publications });
//     } catch (error) {
//       console.error('Ошибка при получении публикаций:', error);
//       res.status(500).json({ message: 'Ошибка сервера' });
//     }
//   });