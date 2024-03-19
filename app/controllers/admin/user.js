var Op = Sequelize.Op;

module.exports = function ( model, config ) {
	var module = {};

	module.view = function ( request, response ) {
		response.render( 'backend/user/users', {
			title: 'User List',
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config,
			alias: 'user'
		} );
	};

	module.getUsers = async function ( request, response ) {

		var start = parseInt( request.query.start );
		var length = parseInt( request.query.length );
		var search = request.query.search.value;
		var query = {};

		if ( search != '' ) {
			query = {
				[ Op.or ]: [
					{ 'name': { [ Op.like ]: '%' + search + '%' } },
					{ 'email_id': { [ Op.like ]: '%' + search + '%' } }
				], type: 'user', 'is_deleted': '0'
			};
		} else {
			query = { type: "user", "is_deleted": "0" };
		}

		var usersCount = await model.User.count( { where: query } );
		var users = await model.User.findAll( { where: query, order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, raw: true } );

		for ( var i = 0; i < users.length; i++ ) {
			if ( users[ i ].profile_image != "" && users[ i ].profile_image != null && users[ i ].profile_image != 'default.png' ) {
				users[ i ].profile_image = '<img width="50px" height="50px" class="rounded-circle" src="/frontend/upload/user/' + users[ i ].profile_image + '">';
			} else {
				users[ i ].profile_image = '<img width="50px" height="50px" class="rounded-circle" src="/frontend/upload/user/default.png">';
			}

			if ( users[ i ].status == 0 || users[ i ].status == "0" ) {
				userEditDelete = '<a style="margin-left:5px;" href="/backend/user/edit/' + users[ i ].id + '" class="btn btn-primary btn-sm" title="Edit User"><i class="fa fa-edit"></i></a><a style="margin-left:5px;" href="/backend/user/unban/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to Unban this user?\')" class="btn btn-success btn-sm" title="Unban user"><i class="glyphicon glyphicon-ban-circle"></i></a><a style="margin-left:5px;" href="/backend/user/delete/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to delete this user?\')" class="btn btn-danger btn-sm" title="Delete User"><i class="fa fa-trash"></i></a>';
			}
			else {
				userEditDelete = '<a style="margin-left:5px;" href="/backend/user/edit/' + users[ i ].id + '" class="btn btn-primary btn-sm" title="Edit User"><i class="fa fa-edit"></i></a><a style="margin-left:5px;" href="/backend/user/ban/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to Ban this user?\')" class="btn btn-danger btn-sm" title="Ban user"><i class="glyphicon glyphicon-ban-circle"></i></a> <a style="margin-left:5px;" href="/backend/user/delete/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to delete this user?\')" class="btn btn-danger btn-sm" title="Delete User"><i class="fa fa-trash"></i></a>';
			}

			if ( users[ i ].moderator_type == 'moderator' || users[ i ].moderator_type == "moderator" ) {
				moderatorButton = '<a href="/backend/user/notmoderator/' + users[ i ].id + '" class="btn btn-success btn-sm" title="Moderator User"><i class="fa fa-star"></i></a>';
			}
			else {
				moderatorButton = '<a href="/backend/user/moderator/' + users[ i ].id + '" class="btn btn-danger btn-sm" title="Not Moderator User"><i class="fa fa-star"></i></a>';
			}

			if ( users[ i ].user_ban_unban_chat == 1 || users[ i ].user_ban_unban_chat == "1" ) {
				chatButton = '<a style="margin-left:5px;" href="/backend/user/unbanchat/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to Unban this user chat?\')" class="btn btn-success btn-sm" title="Unban user chat"><i class="fa fa-comments-o"></i></a>';
			}
			else {
				chatButton = '<a style="margin-left:5px;" href="/backend/user/banchat/' + users[ i ].id + '" onClick="return confirm(\'Are you sure to Ban this user chat?\')" class="btn btn-danger btn-sm" title="Ban user chat"><i class="fa fa-comments-o"></i></a>';
			}
			users[ i ].editDel = moderatorButton + userEditDelete + chatButton;
		}

		var obj = {
			'draw': request.query.draw,
			'recordsTotal': usersCount,
			'recordsFiltered': usersCount,
			'data': users
		};

		return response.send( JSON.stringify( obj ) );
	};

	module.edit = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userDetail = await model.User.findByPk( userId );
				if ( userDetail != null ) {
					response.render( 'backend/user/edit', {
						title: 'Edit User',
						error: request.flash( "error" ),
						success: request.flash( "success" ),
						vErrors: request.flash( "vErrors" ),
						auth: request.session,
						config: config,
						user: userDetail,
						alias: 'user'
					} );
				} else {
					request.flash( 'error', "User detail not available." );
					return response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User detail not available." );
				return response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User detail not available." );
			return response.redirect( '/backend/user' );
		}
	};

	module.update = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {

					var inputData = {
						name: request.body.name,
						user_referral_code: request.body.user_referral_code,
						email_id: request.body.email,
						role: 'user'
					};
					var update_data = await userData.update( inputData );
					request.flash( 'success', "User detail update successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User detail not update." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User detail not update." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User detail not update." );
			response.redirect( '/backend/user' );
		}
	};


	module.ban = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {

					var banData = {
						status: '0',
						role: 'user'
					};
					var ban_user = await userData.update( banData );

					var data = {
						"status": "success",
						"message": "successfully Delete User",
						"socketId": userData.socket_id,
					};
					io.to( userData.socket_id ).emit( "forceLogout", data );

					request.flash( 'success', "User Banned successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available for Ban." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User not Banned." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User not Banned." );
			response.redirect( '/backend/user' );
		}
	};

	module.unban = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {

					var banData = {
						status: 1,
						role: 'user'
					};
					var ban_user = await userData.update( banData );
					request.flash( 'success', "User Unanned successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available for Unban." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User not Unanned." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User not Unbanned." );
			response.redirect( '/backend/user' );
		}
	};

	module.moderator = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {
					var moderatorData = {
						moderator_type: 'moderator'
					};
					var ban_user = await userData.update( moderatorData );
					request.flash( 'success', "User moderator successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available" );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User not moderator." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User not moderator." );
			response.redirect( '/backend/user' );
		}
	};

	module.notmoderator = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {
					var moderatorData = {
						moderator_type: 'user'
					};
					var ban_user = await userData.update( moderatorData );
					request.flash( 'success', "User not moderator successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User not moderator." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User not moderator." );
			response.redirect( '/backend/user' );
		}
	};

	module.banchat = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {
					var banData = {
						user_ban_unban_chat: '1'
					};
					var ban_user = await userData.update( banData );
					await model.Chat.update( { "is_deleted": "1" }, { where: { user_id: userId } } );	//Delete all chat of banned from chat user


					request.flash( 'success', "User Chat Banned successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available for Chat Ban." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User Chat not Banned." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User Chat not Banned." );
			response.redirect( '/backend/user' );
		}
	};

	module.unbanchat = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {
				var userData = await model.User.findByPk( userId );
				if ( userData != null ) {

					var unbanData = {
						user_ban_unban_chat: '0',
					};
					var ban_user = await userData.update( unbanData );
					request.flash( 'success', "User Chat Unbanned successfully." );
					response.redirect( '/backend/user' );
				} else {
					request.flash( 'error', "User details not available for Chat Unban." );
					response.redirect( '/backend/user' );
				}
			} catch ( err ) {
				request.flash( 'error', "User Chat not Unbanned." );
				response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User Chat not Unbanned." );
			response.redirect( '/backend/user' );
		}
	};

	module.delete = async function ( request, response ) {
		var userId = request.params.id;
		if ( userId != "" && userId != 0 ) {
			try {

				var userData = await model.User.findByPk( userId );
				var data = {
					"status": "success",
					"message": "successfully Delete User",
					"socketId": userData.socket_id,
				};
				io.to( userData.socket_id ).emit( "forceLogout", data );
				var gameData = await model.User.update( { "is_deleted": "1" }, { where: { id: userId } } );
				request.flash( 'success', "User delete successfully." );
				return response.redirect( '/backend/user' );
			} catch ( err ) {
				request.flash( 'error', "User not delete." );
				return response.redirect( '/backend/user' );
			}
		} else {
			request.flash( 'error', "User not deleted." );
			return response.redirect( '/backend/user' );
		}
	};
	return module;
};

function randomNumber ( length ) {
	var chars = '0123456789';
	var result = '';
	for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
	return result;
}
