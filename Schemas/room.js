const mongoose = require('mongoose');
const {Schema} = require('mongoose');

const roomSchema = new Schema({
    name: String,
    host: Schema.ObjectId,
    users: [{_id: Schema.ObjectId}],
    rolled: {type: Boolean, default: false}
})

module.exports = mongoose.model('room', roomSchema)