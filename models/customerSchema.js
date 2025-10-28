const mongoose= require('mongoose');
const validator= require('validator')
const userSchema=new mongoose.Schema({
email:{
    type: String ,
    required: true,
    unique: true,
    validate:[validator.isEmail,'Fuiled must be a valid email address']
},
password: {
    type: String,
    required: true,
},
phoneNumber:{
    type: String,
    required: true,
    validate: [validator.isMobilePhone, 'Failed must be a valid phone number']
 }

},{ timestamps: true });

const User = mongoose.model('Customer', userSchema);


module.exports = User;