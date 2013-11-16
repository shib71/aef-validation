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
  
  function keyarray(obj,type){
    var a = [];
    
    for (var k in obj){
      if (typeof(obj[k]) === type)
        a.push(k);
    }
    
    return a;
  }
  
  function invalidateConfig(config,req,message,results){
    results = results || { invalid:[] };
    
    for (var k in config){
      if (typeof(config[k]) === "function"){
        results[k] = new Error(message);
        results.invalid.push(k);
      }
      else if (typeof(config[k]) === "object"){
        invalidateConfigs(config[k],req,message,results);
      }
    }
    
    return results;
  };
  
  function runConfigs(config,req,results){
    // keys
    var keys = keyarray(config,"object");
    
    // value promises
    var values = keys.map(function(key){
      if (results.invalid.length)
        return invalidateConfig(config[key],req,"Depends on missing or invalid information");
      else
        return runValidation(config[key],req);
    });
    values.unshift(results);
    
    return Q.allSettled(values).then(function(values){
      var results = { invalid:[] };
      
      for (var i=0; i<values.length; i++){
        for (var k in values[i].value){
          if (k === "invalid")
            results.invalid = results.invalid.concat(values[i].value.invalid);
          else
            results[k] = values[i].value[k];
        }
      }
      
      return results;
    });
  };
  
  function runFunctions(config,req){
    // keys
    var keys = keyarray(config,"function");
    
    // no functions case
    if (keys.length === 0)
      return Q({ invalid:[] });
    
    // value promises
    var values = keys.map(function(key){
      return config[key](req);
    });
    
    // values
    return Q.allSettled(values).then(function(values){
      var result = { invalid : [] };
      
      for (var i=0; i<values.length; i++){
        if (values[i].state === "rejected")
          result.invalid.push(keys[i]);
        
        result[keys[i]] = values[i].state === "rejected" ? values[i].reason : values[i].value;
      }
      
      return result;
    });
  }
  
  function runValidation(config,req){
    return runFunctions(config,req).then(function(results){
      return runConfigs(config,req,results);  
    });
  }
  
  return function(req,res,next){
    runValidation(config,req).then(function(results){
      req.validation = results;
      
      next();
    }).done();
  };
};