const mongoose = require('mongoose');
const { Schema} = mongoose;

const userSchema = new Schema({
    name: String,
    password: {type: String, select: false},
    rooms: [{_id: Schema.ObjectId, rolled: Schema.ObjectId}],
});


module.exports = mongoose.model('user', userSchema);