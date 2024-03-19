module.exports = function ( Sequelize, Schema, User ) {
	var Roulette = Schema.define( 'roulette_master', {
		game_number: {
			type: Sequelize.BIGINT,
		},
		game_secret: {
			type: Sequelize.STRING
		},
		game_hash: {
			type: Sequelize.STRING
		},
		hash_salt: {
			type: Sequelize.STRING
		},
		round_number: {
			type: Sequelize.STRING
		},
		game_stopped_number: {
			type: Sequelize.INTEGER
		},
		admin_commission_price: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		admin_commission_dollar: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		dollar_price_in_coins: {
			type: Sequelize.INTEGER
		},
		bet_amount: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		game_status: {
			type: Sequelize.ENUM( 'pending', 'completed' ), defaultValue: "pending"
		},
		game_stopped_on: {
			type: Sequelize.ENUM( 'danger', 'green', 'black' )
		},
		is_deleted: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		total_amt_carryforward: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		}
	}, { underscored: true } );
	//Roulette.belongsTo(User, { foreignKey: 'user_id', as: 'userDetail' });
	Roulette.sync( { force: false } );
	return Roulette;
};