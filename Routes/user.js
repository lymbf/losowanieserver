const User = require('../Schemas/user');
const mongoose = require('mongoose')
const {ObjectId} = require("mongodb");
const {Types} = require("mongoose");
const Router = require('express').Router();

Router.get('/', (req, res) => {
    const uID = req.query.id;
    if (!uID) {
        res.status(400).send({error: true, message: 'missing user ID in query string'})
    } else {
        User.findOne({_id: uID}).then(user => {
            res.status(200).send(user)
        }).catch(err => {
            res.status(400).send({error: true, message: 'user not found'})
        })
    }

})

Router.get('/users/:roomId', async (req,res)=>{
    const {roomId} = req.params;
    let users = await User.find({
        'rooms._id': new Types.ObjectId(roomId)
    })
    if(!users) return res.status(400).send('sth went wrong');
    res.status(200).send({data: users})
})

Router.post('/:userId/rooms', (req, res) => {
    console.log('inside POST /user/userId/rooms')
    let {userId} = req.params;
    let {roomId} = req.body;

    User.findOne({_id: userId}).then(user => {
        let i = findRoomIndexById(user.rooms, roomId);
        console.log('i: ', i);
        if(i>=0) {
            res.status(400).send({error: true, message: 'user already joined this room'})
        } else {
            user.rooms.push({_id: roomId, rolled: null})
            user.save().then(user => {
                res.status(200).send({message: 'joined the room', _id: roomId});
            }).catch(err => {
                res.status(400).send({error: true, message: 'unable to join the room'})
            })
        }
    }).catch(err => {
        res.status(400).send({error: true, message: 'unable to join the room'})
    })
})

Router.put('/:userId/rooms/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.params.userId;
    let {rolledId} = req.body;

    User.findOne({_id: userId}).then(user => {
        let i = findRoomIndexById(user.rooms, roomId);
        console.log('rooms: ', user.rooms)
        console.log('i: ', i)
        user.rooms[i].rolled = rolledId;
        user.save()
        res.status(200).send({message: 'updated rolled user'})
    }).catch(err => {
        res.status(400).send({error: true, message: 'unable to update user'})
    })

})

Router.delete('/:userId', (req, res) => {
    const userId = req.params.userId;
    User.deleteOne({_id: userId}).then(count => {
        console.log('deleted: ', count, ' user with id: ', userId)
        res.status(200).send({message: 'deleted user'})
    }).catch(err => {
        res.status(400).send({error: true, message: err})
    })
})

Router.delete('/:userId/rooms/:roomId', (req, res) => {
    const {userId, roomId} = req.params;
    User.findOne({_id: userId}).then(user => {
        let i = findRoomIndexById(user.rooms, roomId);
        user.rooms.splice(i, 1);
        user.save();
        res.status(200).send({message: 'room deleted from user'})
    }).catch(err => {
        res.status(400).send({error: true, message: 'couldnt delete room from user list'})
    })
})

const findRoomIndexById = (rooms, id) => {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i]._id.toString() == id) return i;
    }
    return -1;
}

module.exports = Router