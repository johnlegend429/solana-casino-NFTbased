module.exports = function ( model ) {
	var module = {};
	module.admin = require( './admin' )( model );
	module.web = require( './web' )( model );

	return module;
};