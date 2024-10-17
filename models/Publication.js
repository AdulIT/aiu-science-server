const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  iin: {
    type: String,
    required: true,
  },
  authors: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  output: {
    type: String,
  },
  doi: {
    type: String,
  },
  scopus: {
    type: Boolean,
    default: false,
  },
  wos: {
    type: Boolean,
    default: false,
  },
  isbn: {
    type: String,
  },
  file: {
    type: String,
  },
  publicationType: {
    type: String,
    enum: [
      'scopus_wos',   // Научные труды (Scopus/Web of Science)
      'koknvo',       // КОКНВО
      'conference',   // Материалы конференций
      'articles',     // Статьи РК и не включенные в Scopus/WoS
      'books',        // Монографии, книги и учебные материалы
      'patents'       // Патенты, авторское свидетельство, полезная модель
    ],
    required: true,
  },
});

const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication;