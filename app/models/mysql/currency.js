module.exports = function ( Sequelize, Schema ) {
	var CurrencyMaster = Schema.define( 'currency_master', {
		currency_name: {
			type: Sequelize.STRING
		},
		currency_image: {
			type: Sequelize.STRING, defaultValue: 'btc.svg'
		}
	}, { underscored: true } );

	CurrencyMaster.sync( { force: false } );

	return CurrencyMaster;
};