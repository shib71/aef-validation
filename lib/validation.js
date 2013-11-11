var Q = require("q");
var escape = require("escape-html");

/* retrieves a value from the express 'req' object */
module.exports.value = function(value,req,name,default){
  if (name===undefined || typeof(name) !== "string")
    return Q.reject(new Error("'name' argument is required"));
  
  default = default || undefined;
  
  var children = name.split("."), v = req;
  
  for (var i=0; i<children.length){
    if (!(children[i] in v))
      return Q(default);
    
    v = v[children[i]];
  }
  
  return Q(v);
}

/* throws an error if value is not defined - other falsey values are allowed */
module.exports.required = function(value,req,message){
  if (typeof(message) !== "string")
    throw new Error("message' argument is required")
  
  return value.then(function(value){
    if (value === undefined)
      throw new Error(message);
    
    return value;
  });
}

/* throws an error if the value is not a string or does not match the regular expression */
module.exports.regex = function(value,req,regex,message){
  if (!(regex instanceof RegExp) || !(typeof(message)==="string"))
    throw new Error("'regex' and 'message' arguments are required")
    
  return value.then(function(value){
    if (typeof(value) !== "string")
      throw new Error("Value is not a string");
    
    if (value === undefined)
      return value;
    
    if (value.search(regex) === -1)
      throw new Error(message);
    
    return value;
  });
}

/* escapes all HTML entities in the value; throws an error if value is not a string */
module.exports.escapehtml = function(value,req){
  return value.then(function(value){
    if (typeof(value) !== "string")
      throw new Error("Value is not a string");
    
    if (value === undefined)
      return value;
    
    return escape(value);
  });
}

/* performs a regular expression replacement on the value; throws an error if value is not a string */
module.exports.replace = function(value,req,regex,replacement){
  if (!(regex instanceof RegExp) && !(typeof(regex) === "string"))
    throw new Error("'regex' argument is required");
  
  if (typeof(replacement) !== "string")
    throw new Error("'replacement' argument is required");
  
  return value.then(function(value){
    if (typeof(value) !== "string")
      throw new Error("Value is not a string");
    
    return value.replace(regex,replacement);
  });
}

/* initilializes the value by returning 'new fn(value)' */
module.exports.cast = function(value,req,fn){
  if (typeof(fn) !== "function"))
    throw new Error("'fn' argument is required");
  
  return value.then(function(value){
    return new fn(value);
  });
}