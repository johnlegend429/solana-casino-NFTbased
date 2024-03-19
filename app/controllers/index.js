module.exports = function ( model ) {
	var module = {};

	module.admin = require( './admin.js' )( model );
	module.web = require( './web.js' )( model );

	return module;
};	