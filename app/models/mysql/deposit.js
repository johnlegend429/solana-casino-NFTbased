
module.exports = function ( Sequelize, Schema, User ) {
	var Deposite = Schema.define( 'deposit_master', {
		price: {
			type: Sequelize.DECIMAL( 10, 4 )
		},
		coin: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		actual_price: {
			type: Sequelize.DECIMAL( 10, 10 )
		},
		actual_coin: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		deposit_admin_comission: {
			type: Sequelize.STRING
		},
		admin_commission_in_chips: {
			type: Sequelize.DECIMAL( 10, 10 )
		},
		deposit_inventory_count: {
			type: Sequelize.STRING
		},
		admin_rates: {
			type: Sequelize.STRING
		},
		response_price: {
			type: Sequelize.DECIMAL( 10, 10 )
		},
		response_coin: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		type: {
			type: Sequelize.ENUM( 'coinPayment', 'creditCard', 'opskin' )
		},
		transaction_id: {
			type: Sequelize.STRING
		},
		status: {
			type: Sequelize.ENUM( 'pending', 'accept', 'decline', 'fail' ), defaultValue: 'pending'
		},
		transaction_date: {
			type: Sequelize.DATE
		},
		btcType: {
			type: Sequelize.STRING
		},
		botAccountIndex: {
			type: Sequelize.INTEGER
		},

		transaction_block: {
			type: Sequelize.STRING,
		},
		transaction_signature: {
			type: Sequelize.STRING,
		},
		userWalletAddress: {
			type: Sequelize.STRING,
		},
	}, { underscored: true } );

	Deposite.belongsTo( User, { as: 'userDetail', foreignKey: 'user_id' } );
	Deposite.sync( { force: false } );
	
	return Deposite;
};