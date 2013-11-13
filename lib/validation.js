var Q = require("q");
var escape = require("escape-html");
var util = require("util");

/* retrieves a value from the express 'req' object */
module.exports.value = function(value,req,name,def){
  if (name===undefined || typeof(name) !== "string")
    throw new Error("'name' argument is required");
  
  def = def || undefined;
  
  var children = name.split("."), v = req;
  
  for (var i=0; i<children.length; i++){
    if (!(children[i] in v))
      return Q(def);
    
    v = v[children[i]];
  }
  
  return Q(v);
}

/* throws an error if value is not defined - other falsey values are allowed */
module.exports.required = function(value,req,message){
  if (typeof(message) !== "string")
    throw new Error("'message' argument is required")
  
  return Q(value).then(function(value){
    if (value === undefined)
      throw new Error(message);
    
    return value;
  });
}

/* throws an error if the value is not a string or does not match the regular expression */
module.exports.match = function(value,req,regex,message){
  if (typeof(regex) === "string")
    regex = new RegExp(regex);
  
  if (!(regex instanceof RegExp) || !(typeof(message)==="string"))
    throw new Error("'regex' and 'message' arguments are required")
    
  return Q(value).then(function(value){
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
module.exports.escapeHTML = function(value,req){
  return Q(value).then(function(value){
    if (typeof(value) !== "string")
      throw new Error("Value is not a string");
    
    if (value === undefined)
      return value;
    
    return escape(value);
  });
}

/* performs a regular expression replacement on the value; throws an error if value is not a string */
module.exports.replace = function(value,req,regex,replacement){
  if (typeof(regex) === "string")
    regex = new RegExp(regex);
  
  if (!(regex instanceof RegExp) && !(typeof(regex) === "string"))
    throw new Error("'regex' argument is required");
  
  if (replacement === undefined)
    throw new Error("'replacement' argument is required");
  else if (typeof(replacement) !== "string")
    replacement = replacement.toString();
  
  return Q(value).then(function(value){
    if (typeof(value) !== "string")
      throw new Error("Value is not a string");
    
    return value.replace(regex,replacement);
  });
}

/* initilializes the value by returning 'new fn(value)' */
module.exports.cast = function(value,req,fn){
  if (typeof(fn) !== "function")
    throw new Error("'fn' argument is required");
  
  return Q(value).then(function(value){
    return new fn(value);
  });
}

/* throws an error if validation takes too long */
module.exports.timeout = function(value,req,timeout,message){
  if (typeof(timeout) !== "number")
    throw new Error("'timeout' argument is required");
  
  if (typeof(message) !== "string")
    throw new Error("'message' argument is required");
  
  return Q(value).timeout(timeout,message);
}

/* custom validation via function */
module.exports.fn = function(value,req,fn){
  if (typeof(fn) !== "function")
    throw new Error("'fn' argument is required");
  
  return Q(value).then(function(value){
    var result = Q.defer(), output = undefined;
    
    try{
      output = fn.call(req,value,function(err,actual){
        if (err)
          result.reject(err);
        else
          result.resolve(actual);
      });
      if (output !== undefined){
        result.resolve(output);
      }
    }
    catch(err){
      result.reject(err);
    }
    
    return result.promise;
  });
}

/* method filter - clears values and errors if the method is not correct */
module.exports.method = function(value,req,methods){
  if (typeof(methods) === "string")
    methods = methods.toLowerCase().split(",");
  else if (util.isArray(methods))
    methods = methods.map(function(m){ return m.toLowerCase(); });
  else
    throw new Error("'methods' argument is required");
  
  return Q(value).then(function(value){
    if (methods.indexOf(req.method.toLowerCase()) === -1)
      return undefined;
    else
      return value;
  },function(err){
    if (methods.indexOf(req.method.toLowerCase()) === -1)
      return undefined;
    else
      throw error;
  });
}