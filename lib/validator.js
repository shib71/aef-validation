var validation = require("./validation");
var validationfns = [];

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
      
      return addChainFunction(newfn);
    };
  });
  
  return lastlink;
};

module.exports = {};

addChainFunctions(module.exports);