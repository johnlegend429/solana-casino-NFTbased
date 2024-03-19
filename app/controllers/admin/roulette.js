var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	var module = {};

	module.view = function ( request, response ) {
		response.render( 'backend/roulette/list', {
			title: 'Roulette List',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'roulette'
		} );
	};

	module.getRoulette = async function ( request, response ) {

		var start = parseInt( request.query.start );
		var length = parseInt( request.query.length );
		var search = request.query.search.value;
		var query = { "is_deleted": "0", "game_status": "completed" };
		if ( search != '' ) {
			query = {
				[ Op.or ]: [
					{ 'game_number': { [ Op.like ]: '%' + search + '%' } },
					{ 'round_number': { [ Op.like ]: '%' + search + '%' } },
					{ 'bet_amount': { [ Op.like ]: '%' + search + '%' } }
				], "is_deleted": "0", "game_status": "completed"
			};
		}

		var rouletteCount = await model.Roulette.count( { where: query } );
		var roulettes = await model.Roulette.findAll( { where: query, offset: start, limit: length, raw: true, order: [ [ "id", "DESC" ] ] } );
		console.log( 'roulettes -->', roulettes );
		for ( var i = 0; i < roulettes.length; i++ ) {
			roulettes[ i ].createdDates = roulettes[ i ].createdAt;
			roulettes[ i ].editDel = '<a href="/backend/roulette/detail/' + roulettes[ i ].id + '" class="btn btn-primary btn-sm" title="View Roulette"><i class="glyphicon glyphicon-eye-open"></i></a>';
		}

		var obj = {
			'draw': request.query.draw,
			'recordsTotal': rouletteCount,
			'recordsFiltered': rouletteCount,
			'data': roulettes
		};
		return response.send( JSON.stringify( obj ) );
	};

	module.delete = async function ( request, response ) {
		var rouletteId = request.params.id;
		if ( rouletteId != "" && rouletteId != 0 ) {
			try {
				var gameData = await model.Roulette.update( { "is_deleted": "1" }, { where: { id: rouletteId } } );
				request.flash( 'success', "Game delete successfully." );
				response.redirect( '/backend/roulette' );
			} catch ( err ) {
				console.log( "delete error: ", err );
				request.flash( 'error', "Game not delete." );
				response.redirect( '/backend/roulette' );
			}
		} else {
			request.flash( 'error', "Game not delete." );
			response.redirect( '/backend/roulette' );
		}
	};

	module.detail = async function ( request, response ) {
		var rouletteId = request.params.id;
		// console.log('rouletteId -->', rouletteId);

		if ( rouletteId != "" && rouletteId != 0 ) {
			try {


				var rouletteData = await model.Roulette.findOne( { where: { 'id': rouletteId }, raw: true }, );
				// console.log('rouletteData -->', rouletteData);

				var rouletteHistoryData = await model.RouletteHistory.findAll( { where: { 'roulette_id': rouletteId, selected_color: rouletteData.game_stopped_on } } );
				// console.log('rouletteHistoryData -->', rouletteHistoryData);
				var winAmount = '';

				var createdDate = rouletteHistoryData.created_at;
				var creDate = createdDate;

				if ( rouletteHistoryData.length ) {
					var totalAmout = 0;
					var finalAmount = '';
					for ( var j = 0; j < rouletteHistoryData.length; j++ ) {
						finalAmount = rouletteHistoryData[ j ].winning_amount + totalAmout;
						totalAmout = finalAmount;
					}
					winAmount = finalAmount;
				} else {
					winAmount = 0.00;
				}
				var rouletteHistoryData = await model.RouletteHistory.findAll( { where: { 'roulette_id': rouletteId }, include: [ { model: User, as: 'userDetail' } ] } );
				if ( rouletteData != null ) {
					response.render( 'backend/roulette/detail', {
						title: 'Roulette Detail',
						error: request.flash( "error" ),
						success: request.flash( "success" ),
						vErrors: request.flash( "vErrors" ),
						auth: request.session,
						config: config,
						game: rouletteData,
						rouletteHistoryData: rouletteHistoryData,
						alias: 'roulette',
						winAmount: winAmount,
						creDate: creDate
					} );
				} else {
					request.flash( 'error', "Game detail not available." );
					response.redirect( '/backend/roulette' );
				}


			} catch ( err ) {
				console.log( "delete error: ", err );
				request.flash( 'error', "Game detail not available." );
				response.redirect( '/backend/roulette' );
			}
		} else {
			request.flash( 'error', "Game detail not available." );
			response.redirect( '/backend/roulette' );
		}
	};

	return module;
};