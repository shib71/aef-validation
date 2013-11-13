var test = require("tap").test;
var aefv = require("../index");
var Q = require("q");
var util = require("util");

Q.longStackSupport = true;

test("middleware",function(t){
	t.plan(30);
	
	/* simple middleware - valid */
	var reqA = { 
		query : { abc:123 }, 
		body : { def:"<b>hi</b>" }
	};
	aefv.middleware({
		"abc" : aefv.value("query.abc"),
		"def" : aefv.value("body.def").escapeHTML()
	})(reqA,{},function(){
		t.equal(typeof(reqA.validation),"object","validation object in req");
		t.ok(util.isArray(reqA.validation.invalid),"validation object contains 'invalid' array");
		t.equal(reqA.validation.invalid.length,0,"'invalid' array is empty");
		t.notEqual(reqA.validation.abc,undefined,"'abc' value defined");
		reqA.validation.abc.then(function(val){
			t.equal(val,123,"'abc' value correct");
		}).done();
		t.notEqual(reqA.validation.def,undefined,"'def' value defined");
		reqA.validation.def.then(function(val){
			t.equal(val,"&lt;b&gt;hi&lt;/b&gt;","'def' value correct");
		}).done();
	});
	
	/* simple middleware - invalid */
	var reqB = { 
		body : { def:"<b>hi</b>" }
	};
	aefv.middleware({
		"abc" : aefv.value("query.abc").required("Required field"),
		"def" : aefv.value("body.def").match("abc","Doesn't match")
	})(reqB,{},function(){
		t.equal(typeof(reqB.validation),"object","validation object in req");
		t.ok(util.isArray(reqB.validation.invalid),"validation object contains 'invalid' array");
		t.ok(reqB.validation.invalid.indexOf("abc")>-1,"'invalid' array includes 'abc'");
		t.ok(reqB.validation.invalid.indexOf("def")>-1,"'invalid' array includes 'def'");
		t.notEqual(reqB.validation.abc,undefined,"'abc' value defined");
		reqB.validation.abc.catch(function(err){
			t.equal(err.message,"Required field","'abc' value shown invalid");
		}).done();
		t.notEqual(reqB.validation.def,undefined,"'def' value defined");
		reqB.validation.def.catch(function(err){
			t.equal(err.message,"Doesn't match","'def' value shown invalid");
		}).done();
	});
	
	/* complex middleware - valid */
	var reqC = { 
		query : { abc:123 }, 
		body : { def:"<b>hi</b>" }
	};
	aefv.middleware({
		"a" : {
			"abc" : aefv.value("query.abc"),
			"b" : {
				"def" : aefv.value("body.def").escapeHTML()
			}
		}
	})(reqC,{},function(){
		t.equal(typeof(reqC.validation),"object","validation object in req");
		t.ok(util.isArray(reqC.validation.invalid),"validation object contains 'invalid' array");
		t.equal(reqC.validation.invalid.length,0,"'invalid' array is empty");
		t.notEqual(reqC.validation.abc,undefined,"'abc' value defined");
		reqC.validation.abc.then(function(val){
			t.equal(val,123,"'abc' value correct");
		}).done();
		t.notEqual(reqC.validation.def,undefined,"'def' value defined");
		reqC.validation.def.then(function(val){
			t.equal(val,"&lt;b&gt;hi&lt;/b&gt;","'def' value correct");
		}).done();
	});
	
	/* complex middleware - invalid */
	var reqD = { 
		body : { def:"<b>hi</b>" }
	};
	aefv.middleware({
		"a" : {
			"abc" : aefv.value("query.abc").required("Required field"),
			"b" : {
				"def" : aefv.value("body.def").escapeHTML()
			}
		}
	})(reqD,{},function(){
		t.equal(typeof(reqD.validation),"object","validation object in req");
		t.ok(util.isArray(reqD.validation.invalid),"validation object contains 'invalid' array");
		t.ok(reqD.validation.invalid.indexOf("abc")>-1,"'invalid' array includes 'abc'");
		t.ok(reqD.validation.invalid.indexOf("def")>-1,"'invalid' array includes 'def'");
		t.notEqual(reqD.validation.abc,undefined,"'abc' value defined");
		reqD.validation.abc.catch(function(err){
			t.equal(err.message,"Required field","'abc' value shown invalid");
		}).done();
		t.notEqual(reqD.validation.def,undefined,"'def' value defined");
		reqD.validation.def.catch(function(err){
			t.equal(err.message,"Depends on missing or invalid information");
		}).done();
	});
});