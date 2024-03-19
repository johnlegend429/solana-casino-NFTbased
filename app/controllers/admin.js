module.exports = function ( model ) {
	var module = {};

	//all model loading
	const config = require( '../../config/constants.js' );
	module.login = require( './admin/login' )( model, config );
	module.dashboard = require( './admin/dashboard' )( model, config );
	module.user = require( './admin/user' )( model, config );
	module.cms = require( './admin/cms' )( model, config );
	module.roulette = require( './admin/roulette' )( model, config );
	module.setting = require( './admin/setting' )( model, config );

	module.deposit = require( './admin/deposit' )( model, config );
	module.withdraw = require( './admin/withdraw' )( model, config );
	module.withdrawRequest = require( './admin/withdrawRequest' )( model, config );

	return module;
};
