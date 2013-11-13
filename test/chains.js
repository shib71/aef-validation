var test = require("tap").test;
var aefv = require("../index");
var Q = require("q");

Q.longStackSupport = true;

test("chain",function(t){
	t.plan(6);
	
	/* start chain */
	aefv.value("abc")({ "abc":123 }).then(function(val){
		t.equal(val,123,"expected value");
	}).done();
	
	/* validation chain - valid */
	aefv.value("abc").match(/[bdf]/,"Must match")({ "abc":"def" }).then(function(val){
		t.equal(val,"def","expected value");
	}).done();
	
	/* validation chain - invalid */
	aefv.value("abc").match(/[zyx]/,"Must match")({ "abc":"def" }).then(function(val){
		t.notOk(true,"should return an error");
	},function(err){
		t.equal(err.toString(),"Error: Must match","should return an error");
	}).done();
	
	/* transformation chain */
	aefv.value("abc").replace(/[bdf]/g,"z")({ "abc":"def" }).then(function(val){
		t.equal(val,"zez","expected value");
	}).done();
	
	/* filtering chain - allow through */
	aefv.value("abc").method("POST")({ "abc":"def", "method":"POST" }).then(function(val){
		t.equal(val,"def","expected value");
	}).done();
	
	/* filtering chain - reset */
	aefv.value("abc").method("POST")({ "abc":"def", "method":"GET" }).then(function(val){
		t.equal(val,undefined,"expected no value");
	}).done();
});