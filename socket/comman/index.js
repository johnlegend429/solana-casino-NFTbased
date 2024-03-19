var flag = true;
var loginArrayCreate = [];
var nodemailer = require( 'nodemailer' );

module.exports = function ( model, io, client ) {
	client.on( 'updateUserId', async function ( data ) {
		if ( data == '0' ) {
			var totalUsers = await model.User.count( { where: { type: 'user', is_deleted: '0' }, order: [ [ 'id', 'DESC' ] ] } );
			var logIndata = {
				totalU: totalUsers,
				loginUser: '0'
			};
			io.emit( 'count', logIndata );
		} else {
			var createSimpleArray = { userId: data, socket_id: client.id };
			var newuserAssingResult = loginArrayCreate.filter( ( item ) => item.userId !== createSimpleArray.userId );
			loginArrayCreate = newuserAssingResult;
			loginArrayCreate.push( createSimpleArray );
			var totalUsers = await model.User.count( { where: { type: 'user', is_deleted: '0' }, order: [ [ 'id', 'DESC' ] ] } );
			var logIndata = {
				totalU: totalUsers,
				loginUser: loginArrayCreate.length
			};
			io.emit( 'count', logIndata );
			await model.User.update( { socket_id: client.id }, { where: { jwt_login_token: data } } );
		}
	} );

	client.on( 'disconnect', async function () {
		var disConId = client.id;
		var newuserAssingResult = loginArrayCreate.filter( ( item ) => item.socket_id !== disConId );
		loginArrayCreate = newuserAssingResult;
		var totalUsers = await model.User.count( { where: { type: 'user', is_deleted: '0' }, order: [ [ 'id', 'DESC' ] ] } );
		var logIndata = {
			totalU: totalUsers,
			loginUser: loginArrayCreate.length
		};
		io.emit( 'count', logIndata );
	} );

	client.on( 'getSetting', async function ( callback ) {
		var settingDetail = await model.Setting.findOne( { attributes: [ "max_bet" ] } );
		callback( settingDetail );
	} );

	client.on( 'getcmsDetail', async function ( data, callback ) {
		var cmses = await model.Cms.findAll( { where: { type: data, 'is_deleted': '0' }, raw: true } );
		callback( cmses );
	} );

	client.on( 'supportmailSend', async function ( data, callback ) {
		try {
			var transporter = nodemailer.createTransport( {
				service: 'gmail',
				auth: {
					user: 'node@aistechnolabs.co.uk',
					pass: 'aisnode@44!22'
				}
			} );

			var mailOptions = {
				from: data.email,
				to: "roulette",
				subject: 'Casinc Roulette: Support',
				html: '<p>' + data.desc + '</p>'
			};

			var send = await transporter.sendMail( mailOptions );
			if ( send ) {
				return callback( { 'status': 'success', 'message': 'Ticket create successfully' } );
			} else {
				return callback( { 'status': 'fail', 'message': 'Ticket not create. Please try again.' } );
			}
		} catch ( err ) {
			console.log( err );
			return callback( { 'status': 'fail', 'message': 'something went wrong please try again' } );
		}
	} );

	client.on( 'muteUnmuteVolume', async function ( data, callback ) {
		try {
			var userId = data.user_id;
			var btnvL = data.btnvL;

			if ( userId != 0 && userId != undefined && userId != "" ) {
				var userDetail = await model.User.findOne( { where: { jwt_login_token: userId }, raw: true } );
				// console.log('userDetail -->', userDetail.volume_status );
				if ( userDetail != null ) {
					await userDetail.update( { 'volume_status': btnvL } );
					return callback( { 'status': 'success' } );
				} else {
					return callback( { 'status': 'fail' } );
				}
			}
		} catch ( error ) {
			return callback( { status: "fail", data: '' } );
		}
	} );

	client.on( 'chatRuleAccept', async function ( data, callback ) {
		try {
			var userId = data.userId;

			if ( userId != 0 && userId != undefined && userId != "" ) {
				var userDetail = await model.User.findOne( { where: { jwt_login_token: userId } } );
				if ( userDetail != null ) {
					await userDetail.update( { 'user_can_chat': '0' } );
					return callback( { 'status': 'success' } );
				} else {
					return callback( { 'status': 'fail' } );
				}
			}
		} catch ( error ) {
			return callback( { status: "fail", data: '' } );
		}
	} );

	client.on( 'getchatRuleAccept', async function ( data, callback ) {
		try {
			var userId = data.userId;

			if ( userId != 0 && userId != undefined && userId != "" ) {
				var userDetail = await model.User.findOne( { where: { jwt_login_token: userId } } );
				if ( userDetail != null ) {
					return callback( { 'status': 'success', data: userDetail } );
				} else {
					return callback( { 'status': 'fail', data: '' } );
				}
			}
		} catch ( error ) {
			return callback( { status: "fail", data: '' } );
		}
	} );

	client.on( "changeClintSeed", async function ( data, callback ) {
		// console.log('data -->', data);
		try {
			let getUser = await model.User.findOne( { where: { jwt_login_token: data.userId }, limit: 1, order: [ [ 'id', 'DESC' ] ], raw: true } );
			console.log( 'getUser -->', getUser );

			if ( data.client_seed = '' ) {
				callback( { status: "Error", message: "your client seed are not available. " } );
			}
			var clientseed = helper.randomString( 20 );
			console.log( 'clientseed ->', clientseed );
			var serverSeed = helper.createSecretkey( clientseed );
			console.log( 'serverSeed ->', serverSeed );

			var updateSeed = await model.User.update( {
				client_seed: clientseed,
				server_seed: serverSeed,
				nonce: 0
			},
				{ where: { jwt_login_token: data.userId } }
			);

			console.log( 'updateSeed -->', updateSeed );

			/* var reloadUSer =  await getUser.reload();
			console.log('reloadUSer -->', reloadUSer); */
			let userSeedsUpate = await model.User.findOne( { where: { jwt_login_token: data.userId }, limit: 1, order: [ [ 'id', 'DESC' ] ], raw: true } );
			console.log( 'userSeedsUpate -->', userSeedsUpate );

			callback( { status: "success", data: userSeedsUpate } );
		} catch ( error ) {
			console.log( 'error -->', error );
			callback( { status: "error", message: "Something Went Wrong, Please  Refresh The Page." } );
		}

	} );

	client.on( 'getclintorserverseedData', async function ( data, callback ) {
		// console.log('data -->', data);
		var getUserData = await model.User.findOne( { where: { jwt_login_token: data }, limit: 1, raw: true } );
		// console.log('getUserData ->', getUserData);
		callback( { status: "success", data: getUserData } );
	} );

	client.on( 'getProuvablyDetails', async function ( data, callback ) {
		// console.log('data -->', data);
		if ( data.cnt_seed != '' && data.srv_seed != '' && data.nons != '' ) {
			var sendDetails = await model.RouletteHistory.findOne( { where: { client_seed: data.cnt_seed, server_seed: data.srv_seed, nonce: data.non }, limit: 1, raw: true } );
			console.log( 'sendDetails -->', sendDetails );
			if ( !sendDetails ) {
				return callback( { 'status': 'fail', 'message': 'Not available this details ' } );
			}
			var getStopNumber = await model.Roulette.findOne( { where: { id: sendDetails.roulette_id }, raw: true } );
			if ( getStopNumber ) {
				callback( { status: "success", data: getStopNumber.game_stopped_on } );
			} else {
				return callback( { 'status': 'fail', 'message': 'Not available this details ' } );
			}
		} else {
			return callback( { 'status': 'fail', 'message': ' Please all fild are require. ' } );
		}

	} );

};	