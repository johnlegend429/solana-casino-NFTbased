module.exports = function ( Sequelize, Schema ) {

	var Setting = Schema.define( 'setting_master', {
		chips: {
			type: Sequelize.STRING
		},
		max_bet: {
			type: Sequelize.STRING
		},
		min_bet: {
			type: Sequelize.STRING
		},
		roulette_admin_commission: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		deposit_admin_commission: {
			type: Sequelize.DECIMAL( 10, 2 )
		},
		ternandcond: {
			type: Sequelize.STRING
		},
	}, { underscored: true } );

	Setting.sync( { force: false } );
	return Setting;
};