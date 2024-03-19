// var dateformat = require('dateformat');
// import dateFormat, { masks } from "dateformat";
var dateFormat = require( 'moment' );

var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	// console.log('hh')
	var module = {};

	module.view = function ( request, response ) {
		response.render( 'backend/withdraw/list', {
			title: 'Withdraw List',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'withdraw',
			subAlias: 'list',
		} );
	};

	module.getWithdraw = async function ( request, response ) {

		var start = parseInt( request.query.start );
		var length = parseInt( request.query.length );
		var search = request.query.search.value;
		var query = {};

		if ( search != '' ) {
			var withdrawCount = await model.Withdraw.count( { where: query } );
			var withdrawData = await model.Withdraw.findAll( { where: { [ Op.or ]: [ { '$userDetail.name$': { [ Op.like ]: '%' + search + '%' } } ] }, order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, include: [ { model: model.User, as: 'userDetail' } ] } );
		} else {
			var withdrawCount = await model.Withdraw.count();
			var withdrawData = await model.Withdraw.findAll( { order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, include: [ { model: model.User, as: 'userDetail' } ] } );
		}
		//console.log("Spam Users: ", users);
		var withdrawList = new Array();
		for ( var i = 0; i < withdrawData.length; i++ ) {
			var action = '<a style="margin-left:5px;" href="/backend/withdraw/delete/' + withdrawData[ i ].id + '" onClick="return confirm(\'Are you sure to delete?\')" class="btn btn-danger btn-sm" title="Delete Withdraw"><i class="glyphicon glyphicon-ban-circle"></i></a>';
			var data = {
				user_name: withdrawData[ i ].userDetail.name,
				transaction_id: withdrawData[ i ].transaction_signature,
				coin: withdrawData[ i ].coin,
				SOL: withdrawData[ i ].price,
				status: withdrawData[ i ].status,
				transaction_date: dateFormat( withdrawData[ i ].transaction_date, "mm-dd-yyyy, hh:MM:ss TT" ),
				editDel: action,
			};
			withdrawList.push( data );
		}

		var obj = {
			'draw': request.query.draw,
			'recordsTotal': withdrawCount,
			'recordsFiltered': withdrawCount,
			'data': withdrawList
		};

		return response.send( JSON.stringify( obj ) );
	};

	module.delete = async function ( request, response ) {
		var depositId = request.params.id;
		if ( depositId != "" && depositId != 0 ) {
			try {
				var gameData = await model.Withdraw.findByPk( depositId );
				if ( gameData != null ) {
					gameData.destroy();
					request.flash( 'success', "Withdraw delete successfully." );
					response.redirect( '/backend/withdraw' );
				} else {
					request.flash( 'error', "Withdraw not delete." );
					response.redirect( '/backend/withdraw' );
				}
			} catch ( err ) {
				console.log( "delete error: ", err );
				request.flash( 'error', "Withdraw not delete." );
				response.redirect( '/backend/withdraw' );
			}
		} else {
			request.flash( 'error', "Withdraw not delete." );
			response.redirect( '/backend/withdraw' );
		}
	};

	return module;
};