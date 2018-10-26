var mongoose = require('mongoose');

var AdminSchema = new mongoose.Schema({ 
  username: {
  	type: String,
    required: true
  }, 
  email:String,
  password:String,
  aboutus:String,
  created_date:{ type: Date, default: Date.now }
});
mongoose.model('Admin', AdminSchema);
module.exports = mongoose.model('Admin');