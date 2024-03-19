var Op = Sequelize.Op;

module.exports = function ( model, config ) {

	var module = {};
	module.view = async function ( req, res ) {

		var totalUser = await model.User.findAll(
			{
				where:
					{ type: 'user', is_deleted: '0' },
				attributes: [
					[ Sequelize.fn( 'sum', Sequelize.col( 'total_game_deposite' ) ), 'total_game_deposite' ],
					[ Sequelize.fn( 'sum', Sequelize.col( 'total_win_amount' ) ), 'total_win_amount' ],
					[ Sequelize.fn( 'COUNT', 0 ), 'count' ]
				],
				group: [ 'type' ],
				raw: true
			} );
		console.log( 'totalUser -->', totalUser );

		var totalBetAmount = await model.Roulette.findAll(
			{
				attributes: [
					[ Sequelize.fn( 'sum', Sequelize.col( 'bet_amount' ) ), 'bet_amount' ],
					[ Sequelize.fn( 'sum', Sequelize.col( 'admin_commission_dollar' ) ), 'admin_commission_dollar' ],
				],
				raw: true
			} );
		console.log( 'totalBetAmount -->', totalBetAmount );

		var totalUsrEarning = await model.RouletteHistory.findAll(
			{
				where:
					{ is_won: 'yes' },
				attributes: [
					[ Sequelize.fn( 'sum', Sequelize.col( 'winning_amount' ) ), 'winning_amount' ],
				],
				raw: true
			} );
		console.log( 'totalUsrEarning -->', totalUsrEarning );

		// bet_amount
		res.render( 'backend/dashboard', {
			error: req.flash( "error" ),
			success: req.flash( "success" ),
			vErrors: req.flash( "vErrors" ),
			auth: req.session,
			config: config,
			alias: 'dashboard',
			totalUser: totalUser[ 0 ],
			data: totalBetAmount[ 0 ],
			totalUsrEarning: totalUsrEarning[ 0 ]
		} );
	};

	return module;
};