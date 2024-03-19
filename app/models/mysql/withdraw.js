module.exports = function ( Sequelize, Schema, User ) {
	var Withdraw = Schema.define( 'withdraw_master', {
		price: {
			type: Sequelize.DECIMAL( 10, 4 )
		},
		coin: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		withdraw_inventory_count: {
			type: Sequelize.STRING
		},
		admin_rates: {
			type: Sequelize.STRING
		},
		type: {
			type: Sequelize.ENUM( 'opskin' )
		},
		transaction_date: {
			type: Sequelize.DATE
		},

		transaction_block: {
			type: Sequelize.STRING, //will be updated while approving witdro req
		},
		transaction_signature: {
			type: Sequelize.STRING, //will be updated while approving witdro req
		},
		userWalletAddress: {
			type: Sequelize.STRING,
		},
		status: {
			type: Sequelize.ENUM( "Pending", "Approved", "Rejected" ),
			defaultValue: "Pending",
		},

	}, { underscored: true } );

	Withdraw.belongsTo( User, { as: 'userDetail', foreignKey: 'user_id' } );
	Withdraw.sync( { force: false } );

	return Withdraw;
};