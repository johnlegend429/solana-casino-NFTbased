module.exports = function ( model ) {
	var module = {};

	module.auth = require( './auth' )( model );
	module.admin = require( './admin' )( model );
	return module;
};