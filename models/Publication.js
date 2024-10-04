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
  percentile: {
    type: String,
  },
});

const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication;