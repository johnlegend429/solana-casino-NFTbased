// import dateFormat, { masks } from "dateformat";
// var dateformat = require('dateformat');
var dateFormat = require( 'moment' );
var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	var module = {};

	module.view = function ( request, response ) {
		response.render( 'backend/deposit/list', {
			title: 'Deposit List',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'deposit'
		} );
	};

	module.getDeposit = async function ( request, response ) {

		var start = parseInt( request.query.start );
		var length = parseInt( request.query.length );
		var search = request.query.search.value;
		var query = {};

		if ( search != '' ) {
			var depositCount = await model.Deposit.count( { where: query } );
			var depositData = await model.Deposit.findAll( { where: { [ Op.or ]: [ { '$userDetail.name$': { [ Op.like ]: '%' + search + '%' } } ] }, order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, include: [ { model: model.User, as: 'userDetail' } ] } );
		} else {
			var depositCount = await model.Deposit.count();
			var depositData = await model.Deposit.findAll( { order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, include: [ { model: model.User, as: 'userDetail' } ] } );
		}
		//console.log("Spam Users: ", users);
		var depositList = new Array();
		for ( var i = 0; i < depositData.length; i++ ) {
			var action = '<a style="margin-left:5px;" href="/backend/deposit/delete/' + depositData[ i ].id + '" onClick="return confirm(\'Are you sure to delete?\')" class="btn btn-danger btn-sm" title="Delete Deposit"><i class="glyphicon glyphicon-ban-circle"></i></a>';
			var data = {
				user_name: depositData[ i ].userDetail.name,
				transaction_signature: depositData[ i ].transaction_signature,
				coin: depositData[ i ].coin,
				price: depositData[ i ].price,
				transaction_date: dateFormat( depositData[ i ].transaction_date, "mm-dd-yyyy, hh:MM:ss TT" ),
				editDel: action,
			};
			depositList.push( data );
		}

		var obj = {
			'draw': request.query.draw,
			'recordsTotal': depositCount,
			'recordsFiltered': depositCount,
			'data': depositList
		};

		return response.send( JSON.stringify( obj ) );
	};

	module.delete = async function ( request, response ) {
		var depositId = request.params.id;
		if ( depositId != "" && depositId != 0 ) {
			try {
				var gameData = await model.Deposit.findByPk( depositId );
				if ( gameData != null ) {
					gameData.destroy();
					request.flash( 'success', "Deposit delete successfully." );
					response.redirect( '/backend/deposit' );
				} else {
					request.flash( 'error', "Deposit not delete." );
					response.redirect( '/backend/deposit' );
				}
			} catch ( err ) {
				console.log( "delete error: ", err );
				request.flash( 'error', "Deposit not delete." );
				response.redirect( '/backend/deposit' );
			}
		} else {
			request.flash( 'error', "Deposit not delete." );
			response.redirect( '/backend/deposit' );
		}
	};

	return module;
};