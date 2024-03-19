module.exports = function ( Sequelize, Schema, User, CurrencyMaster ) {
	var WinnerLogMaster = Schema.define( 'winner_log_master', {
		client_seed: {
			type: Sequelize.STRING
		},
		server_seed: {
			type: Sequelize.STRING
		},
		game_hash: {
			type: Sequelize.STRING
		},
		secret_key: {
			type: Sequelize.STRING
		},
		nonce: {
			type: Sequelize.BIGINT
		},
		is_won: {
			type: Sequelize.ENUM( 'pending', 'yes', 'no', 'tie' ),
			defaultValue: 'pending'
		},
		game_name: {
			type: Sequelize.STRING
		},
		winning_amount: {
			type: Sequelize.DECIMAL( 20, 8 ),
			defaultValue: 0.00000000
		},
		loss_amount: {
			type: Sequelize.DECIMAL( 20, 8 ),
			defaultValue: 0.00000000
		},
		game_id: {
			type: Sequelize.INTEGER
		}
	}, { underscored: true } );

	WinnerLogMaster.belongsTo( User, { as: 'userDetail', foreignKey: 'user_id' } );
	WinnerLogMaster.belongsTo( CurrencyMaster, { as: 'currencyDetail', foreignKey: 'currency_id' } );
	WinnerLogMaster.sync( { force: false } );
	return WinnerLogMaster;
};