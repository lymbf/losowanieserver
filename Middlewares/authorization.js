const jwt = require('jsonwebtoken')

module.exports = async (req, res, next)=>{
    console.log('authorizing request')
    let token = req.headers['authorization']
    if(!token) return res.status(400).send({error: true, message: 'unauthorized access'});
    let data = jwt.verify(token, process.env.JWT_SECRET)
    console.log('id: ', data._id);
    if(!data) return res.status(400).send({error: true, message: 'unauthorized access'});
    req.user = {...data, verified: true}
    next();
}