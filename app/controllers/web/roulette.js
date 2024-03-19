var Op = Sequelize.Op;
var sequelize = require( '../../../config/database' )( Sequelize );

module.exports = function ( model, config ) {
	var module = {};
	module.view = async function ( req, res ) {
		try {

			if ( req.session.user ) {
				var rouletteData = await sequelize.query( "SELECT rh.user_id, rh.roulette_id, rm.game_stopped_number, rm.game_stopped_on FROM roulette_histories rh JOIN roulette_masters rm ON rm.id=rh.roulette_id WHERE rh.user_id=" + req.session.user.id + " ORDER BY rh.id DESC LIMIT 5",
					{ type: sequelize.QueryTypes.SELECT } );
				var profileDetail = await model.User.findByPk( req.session.user.id );
				req.session.user.main_balance = profileDetail.main_balance;
			}

			var setting = await model.Setting.findByPk( '1' );


			res.render( 'frontend/roulette', {
				error: req.flash( "error" ),
				success: req.flash( "success" ),
				vErrors: req.flash( "vErrors" ),
				auth: req.session,
				config: config,
				alias: 'game',
				subAlias: 'roulette',
				title: 'Roulette',
				rouletteData: rouletteData,
				setting: setting,

			} );
		} catch ( error ) {
			req.flash( 'error', "Game under maintenance, please after some times." );
			res.redirect( '/' );
		}
	};

	module.provablyfairroulette = async function ( req, res ) {
		try {
			let rouletteData = await model.Roulette.findAll( { where: { game_status: "completed" }, limit: 10, order: [ [ 'id', 'DESC' ] ], raw: true } );
			if ( rouletteData.length ) {
				for ( let i = 0; i < rouletteData.length; i++ ) {
					rouletteData[ i ].created_at = new Date( rouletteData[ i ].created_at );
				}
			}
			res.render( 'frontend/provablyfairroulette', {
				error: req.flash( "error" ),
				success: req.flash( "success" ),
				vErrors: req.flash( "vErrors" ),
				auth: req.session,
				config: config,
				alias: 'provablyfairroulette',
				subAlias: 'provablyfair',
				rouletteData: rouletteData,
				title: 'Provably fair'
			} );
		} catch ( error ) {
			req.flash( "error", "Something went wrong" );
			req.redirect( "/" );
		}
	};

	return module;
};