var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	var module = {};

	module.view = async function ( request, response ) {
		var setting = await model.Setting.findByPk( '1' );
		response.render( 'backend/setting', {
			title: 'Setting',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'setting',
			subAlias: 'setting',
			setting: setting
		} );
	};

	module.update = async function ( request, response ) {
		var inputData = {
			chips: request.body.chips,
			roulette_admin_commission: request.body.admincommission,
			deposit_admin_commission: request.body.depositadmincommission,
			max_bet: request.body.max,
			min_bet: request.body.min,
		};

		if ( request.body.termandcondition ) {
			inputData.ternandcond = '1';
		} else {
			inputData.ternandcond = '0';
		}

		try {
			var setting = await model.Setting.findByPk( '1' );
			var settingData = await setting.update( inputData );
			if ( settingData != null ) {
				request.flash( 'success', "Setting update successfully" );
				response.redirect( '/backend/setting' );
			} else {
				request.flash( 'error', "Setting detail not update." );
				response.redirect( '/backend/setting' );
			}

		} catch ( err ) {
			request.flash( 'error', "Setting detail not update." );
			response.redirect( '/backend/setting' );
		}
	};
	return module;
};