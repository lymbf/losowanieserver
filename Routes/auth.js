const Router = require('express').Router();
const User = require('../Schemas/user')
const jwt = require('jsonwebtoken')


Router.post('/signup', async(req,res)=>{
    if (req.body.name && req.body.password) {
        if(await User.findOne({name: req.body.name})) return res.status(400).send({error: true, message: 'user already exists'})
        let user = new User({name: req.body.name, password: req.body.password})
        console.log(user)
        user.save().then(resp => {
            console.log('added new user')
            let token = jwt.sign({_id: resp._id},process.env.JWT_SECRET)
            return res.status(200).send({message: 'added new user', user: resp, jwt: token})

        }).catch(err => {
            console.log(err);
            console.log('sth went wrong couldnt add user')
            return res.status(400).send({error: true, message: 'couldnt add new user, sth went wrong'})
        });
    }else{
        return res.status(400).send({error: true, message: 'incorrect name or password'})
    }
})

Router.post('/login', async(req, res)=>{
    let {name, password} = req.body;
    let user = await User.findOne({name: name}).select('+password')

    if(!user) return res.status(400).send({error: true, message: 'user not found'});
    console.log('password: ', password, 'user.password: ', user.password)
    if(user.password !== password) return res.status(400).send({error: true, message: 'wrong password'});

    let token = jwt.sign({_id: user._id},process.env.JWT_SECRET)
    return res.status(200).send({message: 'user logged in', user: user, jwt: token})
})


module.exports = Router