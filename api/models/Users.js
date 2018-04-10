/**
 * Users.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt-nodejs');
module.exports = {

  attributes: {
    firstname:{
      type:'string',
      required:true
    },
    lastname:{
      type:'string',
      required:true
    },
    email:{
      type: 'email',
      required: true,
      unique: true
    },
    username:{
      type:'string',
      required: true,
      unique: true
    }
  },
  customToJSON: function(){
    return _.omit(this, ['password'])
  },
  beforeCreate: function(user, cb){
    bcrypt.genSalt(10,function(err,salt){
      bcrypt.hash(user.password, salt, null, function(err, hash){
        if(err) return cb(err);
        user.password = hash;
        return cb();
      })
    })
  }
};

