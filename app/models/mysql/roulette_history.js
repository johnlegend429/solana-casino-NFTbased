module.exports = function ( Sequelize, Schema, User, Roulette ) {

	var RouletteHistory = Schema.define( 'roulette_history', {
		selected_color: {
			type: Sequelize.ENUM( 'danger', 'green', 'black' )
		},
		winning_amount: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		is_won: {
			type: Sequelize.ENUM( 'yes', 'no' ),
			defaultValue: 'no'
		},
		bet_amount: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		client_seed: {
			type: Sequelize.STRING
		},
		server_seed: {
			type: Sequelize.STRING
		},
		nonce: {
			type: Sequelize.BIGINT
		},
	}, { underscored: true } );

	RouletteHistory.belongsTo( User, { foreignKey: 'user_id', as: 'userDetail' } );
	RouletteHistory.belongsTo( Roulette, { foreignKey: 'roulette_id', as: 'rouletteDetail' } );
	RouletteHistory.sync( { force: false } );
	return RouletteHistory;
};