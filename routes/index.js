module.exports = function ( app, model, controllers ) {
	require( './admin.js' )( app, model, controllers.admin );
	require( './web.js' )( app, model, controllers.web );
};	