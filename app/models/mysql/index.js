module.exports = function ( Sequelize, Schema ) {
	var module = {};

	module.Cms = require( './cms' )( Sequelize, Schema );
	module.Setting = require( './setting' )( Sequelize, Schema );
	module.User = require( './user' )( Sequelize, Schema );
	module.Chat = require( './chat' )( Sequelize, Schema );
	module.Deposit = require( './deposit' )( Sequelize, Schema, module.User );
	module.Withdraw = require( './withdraw' )( Sequelize, Schema, module.User );
	module.BetHistory = require( './bet_history' )( Sequelize, Schema, module.User );
	module.Roulette = require( './roulette' )( Sequelize, Schema, module.User, module.Roulette );
	module.RouletteHistory = require( './roulette_history' )( Sequelize, Schema, module.User, module.Roulette );
	module.CurrencyMaster = require( './currency' )( Sequelize, Schema );
	module.WinnerLogMaster = require( './winner_log' )( Sequelize, Schema, module.User, module.CurrencyMaster );
	return module;
};
