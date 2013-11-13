var validation = require("./validation");
var Q = require("q");

var validationfns = [];

for (var k in validation)
  validationfns.push(k);

function addChainFunctions(lastlink){
  validationfns.forEach(function(validator){
    lastlink[validator] = function(){
      var validatorargs = Array.prototype.slice.call(arguments);
      
      var newfn = function(req){
        var theseargs = Array.prototype.slice.call(validatorargs);
        
        theseargs.unshift(req);
        theseargs.unshift(typeof(lastlink)==="function" ? lastlink(req) : undefined);
        
        return validation[validator].apply(validation,theseargs);
      }
      
      return addChainFunctions(newfn);
    };
  });
  
  return lastlink;
};

module.exports = {};

addChainFunctions(module.exports);

module.exports.middleware = function(config,context){
  context = context || config;
  
  function propogateErrors(config,req,message){
    for (var k in config){
      if (typeof(config[k]) === "function"){
        req.validation[k] = Q.reject(new Error(message))
        req.validation.invalid.push(k);
      }
      else if (typeof(config[k]) === "object"){
        propogateErrors(config[k],req,message);
      }
    }
  }
  
  function validateRequest(config,req){
    var eventualValues = [];
    
    for (var k in config){
      if (typeof(config[k]) === "function"){
        (function(key){
          req.validation[key] = config[key].call(context,req);
          req.validation[key].catch(function(){
            req.validation.invalid.push(key);
          });
          eventualValues.push(req.validation[key]);
        })(k);
      }
    }
    
    if (eventualValues.length === 0){
      for (var k in config){
        if (typeof(config[k]) === "object")
          eventualValues.push(validateRequest(config[k],req));
      }
      
      return Q.all(eventualValues);
    }
    else {
      return Q.all(eventualValues).then(function(){
        var eventualSubConfigs = [];
        
        for (var k in config){
          if (typeof(config[k]) === "object")
            eventualSubConfigs.push(validateRequest(config[k],req));
        }
        
        return Q.all(eventualSubConfigs);
      },function(err){
        for (var k in config){
          if (typeof(config[k]) === "object")
            propogateErrors(config[k],req,"Depends on missing or invalid information");
        }
        
        return true;
      });
    }
  }
  
  return function(req,res,next){
    req.validation = { invalid:[] };
    
    validateRequest(config,req).finally(function(){
      next();
    });
  };
};