var test = require("tap").test;
var validation = require("../lib/validation");
var Q = require("q");

Q.longStackSupport = true;

test("validation - value",function(t){
	t.plan(6);
	
	/* no variable name */
	try{
	  validation.value(undefined,{}).done();
	} catch(err) {
		t.equal(err.message,"'name' argument is required","missing variable name");
	}
	
	/* invalid variable name */
	try{
	  validation.value(undefined,{},{}).done();
	} catch(err) {
		t.equal(err.message,"'name' argument is required","invalid variable name");
	}
	
	/* simple variable name */
  validation.value(undefined,{ abc:123 },"abc").then(function(val){
  	t.equal(val,123,"simple value name");
  }).done();
  
  /* complex variable name */
  validation.value(undefined,{ abc:{ def:123 } },"abc.def").then(function(val){
  	t.equal(val,123,"complex value name");
  }).done();
  
  /* no default */
  validation.value(undefined,{},"abc").then(function(val){
  	t.equal(val,undefined,"undefined value");
  }).done();
  
  /* default */
  validation.value(undefined,{},"abc","abc").then(function(val){
  	t.equal(val,"abc","undefined value with default");
  }).done();
});

test("validation - required",function(t){
	t.plan(4);
	
	/* missing error message */
	try{
	  validation.required(123,{}).done();
	} catch(err) {
		t.equal(err.message,"'message' argument is required","missing message error");
	}
	
	/* invalid erro message */
	try{
	  validation.required(123,{},{}).done();
	} catch(err) {
		t.equal(err.message,"'message' argument is required","invalid message error");
	}
  
  /* error on missing value */
  validation.required(undefined,{},"Required field").then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Required field","Validation error on missing value");
  }).done();
  
  /* no error on value */
  validation.required(123,{},"Required field").then(function(val){
  	t.equal(val,123,"expected value returned");
  }).done();
});

test("validation - match",function(t){
	t.plan(9);
	
	/* missing regex and message */
	try{
	  validation.match("abc",{}).done();
	} catch(err) {
		t.equal(err.message,"'regex' and 'message' arguments are required");
	}
	
	/* missing message */
	try{
	  validation.match("abc",{},"abc").done();
	} catch(err) {
		t.equal(err.message,"'regex' and 'message' arguments are required");
	}
	
	/* invalid regex */
	try{
	  validation.match("abc",{},123,"Not valid").done();
	} catch(err) {
		t.equal(err.message,"'regex' and 'message' arguments are required");
	}
	
	/* invalid message */
	try{
	  validation.match("abc",{},"b",123).done();
	} catch(err) {
		t.equal(err.message,"'regex' and 'message' arguments are required");
	}
	
	/* error on non-string value */
  validation.match(123,{},"b","Not valid").then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Value is not a string");
  }).done();
  
	/* error on non-match - string */
  validation.match("abc",{},"z","Not valid").then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Not valid");
  }).done();
  
	/* error on non-match - RegExp */
  validation.match("abc",{},/[zyx]/,"Not valid").then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Not valid");
  }).done();
  
  /* no error on match - string */
  validation.match("abc",{},"b","Not valid").then(function(val){
  	t.equal(val,"abc","expected value returned");
  }).done();
  
  /* no error on match - RegExp */
  validation.match("abc",{},/[bdf]/,"Not valid").then(function(val){
  	t.equal(val,"abc","expected value returned");
  }).done();
});

test("validation - escapeHTML",function(t){
	t.plan(2);
	
	/* error on non-string value */
  validation.escapeHTML(123,{}).then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Value is not a string");
  }).done();
  
  /* escaped value returned */
  validation.escapeHTML("<b>hello world</b>",{}).then(function(val){
  	t.equal(val,"&lt;b&gt;hello world&lt;/b&gt;","escaped value should be returned");
  }).done();
});

test("validation - replace",function(t){
	t.plan(8);
	
	/* missing regex */
	try{
	  validation.replace("abc",{}).done();
	} catch(err) {
		t.equal(err.message,"'regex' argument is required");
	}
	
	/* missing replacement */
	try{
	  validation.replace("abc",{},"abc").done();
	} catch(err) {
		t.equal(err.message,"'replacement' argument is required");
	}
	
	/* invalid regex */
	try{
	  validation.replace("abc",{},123,"").done();
	} catch(err) {
		t.equal(err.message,"'regex' argument is required");
	}
	
	/* error on non-string value */
  validation.replace(123,{},"b","z").then(function(val){
  	t.notOk(true,"no value should be returned");
  },function(err){
  	t.equal(err.message,"Value is not a string");
  }).done();
  
	/* replace matching string */
  validation.replace("abc",{},"b","z").then(function(val){
  	t.equal(val,"azc","string replaced");
  }).done();
  
	/* replace matching regex */
  validation.replace("abcdefg",{},/[bdf]/g,"z").then(function(val){
  	t.equal(val,"azczezg","regex replaced");
  }).done();
  
  /* non-matching string */
  validation.replace("abc",{},"m","z").then(function(val){
  	t.equal(val,"abc","string not matched");
  }).done();
  
  /* non-matching regex */
  validation.replace("abcdefg",{},/[mno]/g,"z").then(function(val){
  	t.equal(val,"abcdefg","regex not matched");
  }).done();
});

test("validation - cast",function(t){
	t.plan(1);
	
  /* escaped value returned */
  validation.cast("123",{},RegExp).then(function(val){
  	t.ok(val instanceof RegExp,"returned value cast as RegExp");
  }).done();
});

test("validation - timeout",function(t){
	t.plan(6);
	
	/* missing timeout */
	try{
	  validation.timeout("abc",{}).done();
	} catch(err) {
		t.equal(err.message,"'timeout' argument is required");
	}
	
	/* missing message */
	try{
	  validation.timeout("abc",{},123).done();
	} catch(err) {
		t.equal(err.message,"'message' argument is required");
	}
	
	/* invalid timeout */
	try{
	  validation.timeout("abc",{},"abc","Timed out").done();
	} catch(err) {
		t.equal(err.message,"'timeout' argument is required");
	}
	
	/* invalid message */
	try{
	  validation.timeout("abc",{},123,123).done();
	} catch(err) {
		t.equal(err.message,"'message' argument is required");
	}
	
  /* value returned in time */
  validation.timeout(Q(123).delay(10),{},20,"Timed out").then(function(val){
  	t.equal(val,123,"returned value in time");
  }).done();
  
  /* value NOT returned in time */
  validation.timeout(Q(123).delay(20),{},10,"Timed out").then(function(val){
  	t.notOk(true,"should time out");
  },function(err){
  	t.equal(err.message,"Timed out","should time out");
  }).done();
});

test("validation - fn",function(t){
	t.plan(8);
	
	/* missing fn */
	try{
	  validation.fn("abc",{}).done();
	} catch(err) {
		t.equal(err.message,"'fn' argument is required");
	}
	
	/* invalid fn */
	try{
	  validation.fn("abc",{},123).done();
	} catch(err) {
		t.equal(err.message,"'fn' argument is required");
	}
	
	
  /* value returned by function */
  validation.fn(123,{},function(val,cb){
  	return val * 2;
  }).then(function(val){
  	t.equal(val,246,"returned expected value");
  }).done();
  
  /* value returned as promise */
  validation.fn(123,{},function(val,cb){
  	return Q(val / 2);
  }).then(function(val){
  	t.equal(val,61.5,"returned expected promise");
  }).done();
	
  /* value set with callback */
  validation.fn(123,{},function(val,cb){
  	return cb(undefined,val * 3);
  }).then(function(val){
  	t.equal(val,369,"returned expected value");
  }).done();
  
  
  /* error thrown */
  validation.fn(123,{},function(val,cb){
  	throw new Error("Some error");
  }).then(function(val){
  	t.notOk(true,"expected error");
  },function(err){
  	t.equal(err.message,"Some error","expected error");
  }).done();
  
  /* error returned as promise */
  validation.fn(123,{},function(val,cb){
  	return Q.reject(new Error("Some other error"));
  }).then(function(val){
  	t.notOk(true,"expected error");
  },function(err){
  	t.equal(err.message,"Some other error","expected error");
  }).done();
	
  /* error set with callback */
  validation.fn(123,{},function(val,cb){
  	cb(new Error("Another error"));
  }).then(function(val){
  	t.notOk(true,"expected error");
  },function(err){
  	t.equal(err.message,"Another error","expected error");
  }).done();
});

test("validation - method",function(t){
	t.plan(4);
	
	/* missing methods */
	try{
	  validation.method("abc",{}).done();
	} catch(err) {
		t.equal(err.message,"'methods' argument is required");
	}
	
	/* invalid methods */
	try{
	  validation.method("abc",{},123).done();
	} catch(err) {
		t.equal(err.message,"'methods' argument is required");
	}
	
  /* valid method */
  validation.method(123,{ method:"GET" },"GET").then(function(val){
  	t.equal(val,123,"returned value");
  }).done();
  
  /* invalid method */
  validation.method(123,{ method:"GET" },"POST").then(function(val){
  	t.equal(val,undefined,"returned undefined");
  }).done();
});
