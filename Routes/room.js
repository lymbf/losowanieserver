const Router = require('express').Router();
const Room = require('../Schemas/room')
const User = require('../Schemas/user')
const {Schema, Types} = require("mongoose");
const mongoose = require('mongoose')

Router.get('/:roomId', async (req, res) => {
    const {roomId} = req.params;
    let room = await Room.findOne({_id: roomId});
    if (!room) return res.status(400).send({error: true, message: 'room not found'})
    res.status(200).send({data: room})
})

Router.get('/', async (req, res) => {
    const userId = req.user._id

    let rooms = await Room.find({'users._id': new Types.ObjectId(userId)})
    if (!rooms.length) return res.status(400).send({error: true, message: 'no rooms found'})
    res.status(200).send({data: rooms})
})



Router.post('/', async (req, res) => {
    let {name} = req.body;
    if (!name) return res.status(400).send({error: true, message: 'incorrect or missing name of the room'});
    if (await Room.findOne({name: name})) return res.status(400).send({
        error: true,
        message: 'room with this name already exists'
    })
    let room = new Room({name: name, host: req.user._id, users: [{_id: req.user._id}]})
    let user = await User.findOne({_id: req.user._id});
    if (!user) return res.status(400).send({error: true, message: 'sth went wrong..'})
    let data = await room.save();
    user.rooms.push({_id: room._id, rolled: null});
    await user.save();
    if (!data) return res.status(400).send({error: true, message: 'sth went wrong while accessing database'})
    res.status(200).send({data: data})
})

Router.post('/join/:roomName', async (req, res) => {
    let {roomName} = req.params;
    let userId = req.user._id;

    let room = await Room.findOne({name: roomName});
    if (!room) return res.status(400).send({error: true, message: 'room not found'})
    let roomId = room._id;
    let user = await User.findOne({_id: userId})
    if (!user) return res.status(400).send({error: true, message: 'authorization error'})

    if (room.rolled) res.status(400).send({error: true, message: 'room has already rolled the gifts, unable to join'})
    if (findUserIndexById(room.users, userId) >= 0) return res.status(400).send({
        error: true,
        message: 'user already exists in this room'
    })
    room.users.push({_id: userId});
    if (findRoomIndexById(user.rooms, roomId) < 0) user.rooms.push({_id: roomId, rolled: null})
    let r1 = await user.save();
    let r2 = await room.save();
    return res.status(200).send({message: 'user joined the room', user: r1, room: r2})
})


Router.post('/:roomId/roll', async (req, res) => {
    const {roomId} = req.params;
    let users = await User.find({'rooms._id': new Types.ObjectId(roomId)});
    if (users.length === 1) return res.status(400).send({error: true, message: 'w pokoju znajduje sie 1 osoba'})
    let rolled = rollGifts(users);
    console.log('rolled: ', rolled)
    try {
        for (let i = 0; i < rolled.length; i++) {
            let u1Id = rolled[i][0];
            let u2Id = rolled[i][1];
            let u = await User.findOne(u1Id);
            let ri = findRoomIndexById(u.rooms, roomId);
            u.rooms[ri].rolled = u2Id;
            await u.save();
        }
        await Room.updateOne({_id: roomId}, {rolled: true});
        return res.status(200).send({message: 'successfully rolled out'})
    } catch (err) {
        console.log('err: ', err.message)
        return res.status(400).send({message: 'sth went wrong', error: true})
    }

})

Router.post('/:roomId/unroll', async (req, res) => {
    const {roomId} = req.params;
    let users = await User.find({'rooms._id': new Types.ObjectId(roomId)});
    if (!users) return res.status(400).send({error: true, message: 'sth went wrong... .'});
    try {
        for (let i = 0; i < users.length; i++) {
            let uid = users[i]._id;
            let u = await User.findOne(uid);
            let ri = findRoomIndexById(u.rooms, roomId);
            u.rooms[ri].rolled = null;
            await u.save();
        }
        await Room.updateOne({_id: roomId}, {rolled: false});
        return res.status(200).send({message: 'successfully rolled out'})
    } catch (err) {
        console.log('err: ', err.message)
        return res.status(400).send({message: err.message, error: true})
    }
})

Router.put('/', (req, res) => {

})

Router.delete('/:roomId/user/:userId', async (req, res) => {
    let {roomId, userId} = req.params;
    let room = await Room.findOne({_id: roomId});
    let user = await User.findOne({_id: userId});
    if (!room || !user) return res.status(400).send({error: true, message: 'wrong parameter/s'})
    if (room.rolled) return res.status(400).send({error: true, message: 'room already rolled'});
    if (userId === room.host.toString()) return res.status(400).send({
        error: true,
        message: 'cannot remove host from the room'
    });
    // if (req.user._id.toString() !== room.host.toString()) return res.status(400).send({
    //     error: true,
    //     message: 'anuthorized acces -> only hosts can delete users'
    // });
    let ui = findUserIndexById(room.users, userId);
    let ri = findRoomIndexById(user.rooms, roomId)
    user.rooms.splice(ri, 1);
    room.users.splice(ui, 1);
    await user.save();
    await room.save();
    res.status(200).send({message: 'removed user: ' + user.name + 'from room: ' + room.name})
})

Router.delete('/:roomId', async (req, res) => {
    let {roomId} = req.params;
    let room = await Room.findOne({_id: roomId});
    let users = await User.find({'rooms._id': new Types.ObjectId(roomId)});

    if (!room) return res.status(400).send({error: true, message: 'given room doesnt exist'})
    if (room.host.toString() !== req.user._id.toString()) return res.status(400).send({
        error: true,
        message: 'unauthorized -> only hosts can delete rooms'
    })

    Room.deleteOne({_id: roomId}).then(r => {
        console.log('r: ', r)
        users.forEach(user => {
            let i = findRoomIndexById(user.rooms, roomId);
            user.rooms.splice(i, 1);
            user.save();
        })
    }).catch(err => {
        return res.status(400).send({error: true, message: 'sth went wrong'})
    })
    return res.send('deleted')
})


let randomize = (l) => {
    return Math.floor(Math.random() * (l))
}

const rollGifts = (users) => {
    let l = users.length;
    let arr = [...users];
    let arr2 = [...users];
    let res = [];
    for (let i = 0; i < users.length; i++) {
        let j = randomize(l)
        if (i === (arr.length - 1)) {
            if (arr[i]._id.toString() === arr2[j]._id.toString()) {
                return rollGifts(users)
            } else {
                res.push([arr[i]._id, arr2[j]._id]);
                return res;
            }
        }
        while (arr[i]._id === arr2[j]._id) {
            j = randomize(l);
        }
        res.push([arr[i]._id, arr2[j]._id]);
        arr2.splice(j, 1);
        l--;
        j = randomize(l)
    }
}


// let data = [{_id: 'jacek'}, {_id: 'tyhjk'}, {_id: 'ppp'}, {_id: 'zzz'}, {_id: 'asd'}, {_id: 'qwe'}];
//
// console.log(roll(data))
const findRoomIndexById = (rooms, id) => {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i]._id.toString() == id) return i;
    }
    return -1;
}

const findUserIndexById = (users, id) => {
    for (let i = 0; i < users.length; i++) {
        if (users[i]._id.toString() === id) return i;
    }
    return -1;
}
module.exports = Router