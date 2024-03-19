var Op = Sequelize.Op;
var currentDate = new Date();

module.exports = function ( model, config ) {
	var module = {};

	module.view = async function ( req, res ) {
		try {
			if ( req.session.user.id ) {
				var userId = req.session.user.id;
				var profileDetail = await model.User.findByPk( userId ).then( profileRes => {
					return profileRes;
				} );

				var setting = await model.Setting.findByPk( '1' );

				res.render( 'frontend/profile', {
					error: req.flash( "error" ),
					success: req.flash( "success" ),
					vErrors: req.flash( "vErrors" ),
					auth: req.session,
					config: config,
					alias: 'Profile',
					subAlias: 'profile',
					title: 'Profile',
					detail: profileDetail,
					setting: setting,
				} );
			} else {
				req.flash( 'error', "Please log in to Play" );
				res.redirect( '/' );
			}
		} catch ( error ) {
			console.log( "Error when profile page view: ", error );
			res.redirect( '/' );
		}
	};

	module.save = async function ( req, res ) {
		try {
			if ( req.body != null ) {
				if ( req.session.user ) {
					var userId = req.session.user.id;
					var name = req.body.name;

					var userDetail = await model.User.findByPk( userId ).then( userRes => {
						return userRes;
					} );
					if ( !userDetail ) {
						req.flash( 'error', "User detail not found, please try again" );
						res.redirect( '/profile' );
					} else if ( userDetail.is_login == 0 ) {
						req.flash( 'error', "User data not found, please try again" );
						res.redirect( '/profile' );
					} else {
						var updateData = {};
						if ( req.body.name ) {
							updateData.name = req.body.name;
						}
						if ( req.files ) {
							let profile_images = req.files.myfiles;
							var tempNum = helper.randomNumber( 6 );
							image_name = tempNum + ".jpg";
							profile_images.mv( './public/frontend/upload/user/' + image_name, async function ( uploadErr ) {
							} );
							updateData.profile_image = image_name;

						}
						await userDetail.update( updateData );
						await userDetail.reload();
						req.session.user = userDetail;
						req.flash( 'success', "User detail saved successfully" );
						res.redirect( '/profile' );
					}
				} else {
					req.flash( 'error', "User detail not found, please try again" );
					res.redirect( '/profile' );
				}
			} else {
				req.flash( 'error', "User detail not found, please try again" );
				res.redirect( '/profile' );
			}
		} catch ( error ) {
			console.log( "Error when profile page view: ", error );
			req.flash( 'error', "Somthing want wrong" );
			res.redirect( '/profile' );
		}
	};



	module.userchatdelete = async function ( req, res ) {
		var chatId = req.params.id;
		if ( chatId != "" && chatId != 0 ) {
			try {
				var userId = req.session.user.id;
				if ( userId != "" && userId != 0 ) {
					var userDetail = await model.User.findByPk( userId );
					if ( userDetail.moderator_type == "moderator" ) {
						var chatData = await model.Chat.findByPk( chatId );
						if ( chatData != null ) {
							var userData = await model.User.findByPk( chatData.user_id );
							if ( userData != null ) {
								await model.Chat.update( { "is_deleted": "1" }, { where: { id: chatId } } );
								var banData = {
									user_ban_unban_chat: '1'
								};
								await userData.update( banData );
								req.flash( 'success', "User Chat Banned and Delete successfully." );
								res.redirect( '/' );
							} else {
								req.flash( 'error', "User details not available." );
								res.redirect( '/' );
							}
						} else {
							req.flash( 'error', "Chat data not found" );
							res.redirect( '/' );
						}
					} else {
						req.flash( 'error', "You can not delete chat." );
						res.redirect( '/' );
					}
				} else {
					req.flash( 'error', "Please log in to Play." );
					res.redirect( '/' );
				}
			} catch ( err ) {
				console.log( err );
				req.flash( 'error', "Chat data not found." );
				res.redirect( '/' );
			}
		} else {
			req.flash( 'error', "Chat data not found" );
			res.redirect( '/roulette' );
		}
	};



	return module;
};