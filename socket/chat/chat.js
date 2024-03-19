const Op = Sequelize.Op;
const { raw } = require( 'body-parser' );
var striptags = require( 'striptags' );

module.exports = function ( model ) {
	var module = {};

	module.getMessages = async function ( callback ) {
		try {
			var query = { "user_ban_unban_chat": "1" };
			var userData = await model.User.findAll( { where: query } );
			var allUserId = [];
			for ( var i = 0; i < userData.length; i++ ) {
				allUserId.push( userData[ i ].dataValues.id );
			}

			var chat = await model.Chat.findAll( { limit: 100, is_deleted: '0', order: [ [ 'id', 'DESC' ] ] } );
			if ( chat.length > 0 ) {
				lastId = chat[ chat.length - 1 ].id;
			} else {
				lastId = 1;
			}

			var moderatorUser = await model.User.findAll( { where: { 'is_deleted': '0', 'moderator_type': 'moderator' } } );
			var moderatorId = [];
			for ( var i = 0; i < moderatorUser.length; i++ ) {
				moderatorId.push( moderatorUser[ i ].id );
			}

			model.Chat.findAll( { where: { id: { [ Op.gte ]: lastId }, is_deleted: '0', user_id: { [ Op.notIn ]: allUserId } }, include: [ { model: model.User, as: 'userDetail' } ], raw: true } ).then( function ( chatData ) {
				// console.log('chatData -->', chatData);				
				callback( { 'status': 'success', 'message': 'Chat available', 'data': chatData, 'moderatorUser': moderatorId, } );
			} );
		} catch ( error ) {
			callback( { 'status': 'fail', 'message': 'Chat not available' } );
		}
	};

	module.chatMessageSave = async function ( data, callback ) {
		try {
			console.log( 'ON --- chatMessageSave ' );

			if ( data != null ) {
				var userId = data.userId;
				if ( userId != null && userId != 0 && userId != undefined ) {
					var message = data.message;
					if ( message != null && message != undefined && message != "" ) {
						var msgdata = message;
						msgdata = striptags( msgdata );
						var profileDetail = await model.User.findOne( { where: { "jwt_login_token": userId }, raw: true } );

						if ( profileDetail.is_deleted == '1' ) {
							return callback( { 'status': 'fail', 'message': 'Your account deleted from admin side. please contact to admin.' } );
						}

						if ( profileDetail.is_login == 1 ) {
							console.log( 'profileDetail.user_can_chat -->', profileDetail.user_can_chat );
							if ( profileDetail.user_can_chat == 0 ) {
								console.log( 'yes-------------' );
								if ( profileDetail.user_ban_unban_chat == 0 ) {
									if ( profileDetail.status == 1 ) {

										var chatResult = await model.Chat.create( { 'chat_message': msgdata, "user_id": profileDetail.id, 'anymos': profileDetail.anymos } );
										if ( chatResult ) {

											var moderatorUser = await model.User.findAll( { where: { 'is_deleted': '0', 'moderator_type': 'moderator' } } );
											var moderatorId = [];
											for ( var i = 0; i < moderatorUser.length; i++ ) {
												moderatorId.push( moderatorUser[ i ].id );
											}
											var chatDetail = await model.Chat.findAll( { limit: 100, where: { is_deleted: '0' }, order: [ [ 'id', 'ASC' ] ], include: [ { model: model.User, as: 'userDetail' } ], raw: true } );
											// console.log('chatDetail -->', chatDetail);
											var lastMessage = chatDetail[ chatDetail.length - 1 ];
											return callback( {
												'status': 'success',
												'message': 'Message send successfully.',
												data: chatDetail,
												moderatorUser: moderatorId,
												lastMessage: lastMessage
											} );

										} else {
											callback( { 'status': 'fail', 'message': 'Somthing wrong, please try again.' } );
										}
									} else {
										callback( { 'status': 'fail', 'message': 'You have been banned. Please contact to admin' } );
									}
								} else {
									callback( { 'status': 'fail', 'message': 'You have been banned chat. Please contact to admin' } );
								}
							} else {
								callback( { 'status': 'fail', 'message': 'Please accept chat rules.', 'popup': 'show' } );
							}
						} else {
							callback( { 'status': 'fail', 'message': 'User data not found. Please log in to Play' } );
						}
					} else {
						callback( { 'status': 'fail', 'message': 'Please enter message to start conversation' } );
					}
				} else {
					callback( { 'status': 'fail', 'message': 'Please logout and after login' } );
				}
			} else {
				callback( { 'status': 'fail', 'message': 'Somthing wrong, please page refresh.' } );
			}
		} catch ( error ) {
			callback( { 'status': 'fail', 'message': 'Chat not available' } );
		}

	};
	return module;
};