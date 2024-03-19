var numeral = require( 'numeral' );
var bcrypt = require( 'bcrypt-nodejs' );
var md5 = require( 'md5' );
const { check, validationResult } = require( 'express-validator/check' );
var nodemailer = require( 'nodemailer' );

module.exports = function ( model, config ) {
	var module = {};
	module.signin = function ( request, response ) {
		var emailId = "";
		var password = "";
		if ( request.cookies.admin_login_detail != null && request.cookies.admin_login_detail != undefined ) {
			var emailId = request.cookies.admin_login_detail.email_id;
			var password = request.cookies.admin_login_detail.password;
		}
		return response.render( 'backend/auth/login', {
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			session: request.session,
			config: config,
			emailId: emailId,
			password: password,
		} );
	};

	module.signinCheck = async function ( request, response ) {
		var emailId = request.body.email;
		var password = md5( request.body.password );
		console.log( 'request.body -->', request.body );
		try {
			var userDetail = await model.User.findOne( { where: { 'email_id': emailId, 'password': password } } ).then( result => {
				if ( request.body.remember ) {
					response.cookie( 'admin_login_detail', { 'email_id': emailId, 'password': request.body.password } );
				} else {
					response.clearCookie( 'admin_login_detail' );
				}
				return result;
			} ).catch( function ( err ) {
				request.flash( 'error', "Email-id or password invalid" );
				return request.redirect( '/backend' );
			} );

			if ( userDetail.type == 'admin' ) {
				if ( userDetail != null && userDetail != undefined ) {
					request.session.admin = userDetail;
					request.flash( 'success', "Login successfully" );
					return response.redirect( '/backend/dashboard' );
				} else {
					request.flash( 'error', "Email-id or password invalid" );
					return response.redirect( '/backend' );
				}
			}
		} catch ( err ) {
			request.flash( 'error', "Email-id or password invalid" );
			return response.redirect( '/backend' );
		}
	};

	module.logout = function ( request, response ) {
		delete request.session.admin;
		request.flash( 'success', "Logout successfully" );
		return response.redirect( '/backend' );

	};

	module.forget = function ( request, response ) {
		return response.render( 'backend/auth/forget', {
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			session: request.session,
			config: config
		} );
	};

	module.forgetPassword = async function ( request, response ) {
		var emailId = request.body.email;
		try {
			if ( emailId != "" && emailId != null ) {
				var userDetail = await model.User.findOne( { where: { 'email_id': emailId, type: 'admin' } } );
				if ( userDetail != null ) {
					var newPassword = generatePassword( 8 );
					var transporter = nodemailer.createTransport( {
						service: 'gmail',
						auth: {
							user: 'vasu@aistechnolabs.biz',
							pass: 'ais@1234'
						}
					} );

					var mailOptions = {
						from: 'support@casingroulette.gg',
						to: emailId,
						subject: 'Casinc-Roulette: Forgot Password',
						html: '<p>Hello ' + userDetail.name + ',<br><br>Your new password is: <b>' + newPassword + ' </b></p>'
					};

					var send = await transporter.sendMail( mailOptions );

					if ( send ) {
						var userUpdate = await userDetail.update( { 'password': md5( newPassword ) } );
						request.flash( 'success', "New Password sent on your email address" );
						return response.redirect( '/backend' );
					} else {
						request.flash( 'error', "Somthing wrong, please try again." );
						return response.redirect( '/login/forget' );
					}
				} else {
					request.flash( 'error', "Email-id is wrong." );
					return response.redirect( '/login/forget' );
				}
			} else {
				request.flash( 'error', "Please enter email-id." );
				return response.redirect( '/login/forget' );
			}
		} catch ( err ) {
			request.flash( 'error', "Email-id is wrong." );
			return response.redirect( '/login/forget' );
		}
	};

	module.changePassword = function ( request, response ) {
		response.render( 'backend/auth/changepassword', {
			title: "Change Password",
			error: request.flash( "error" ),
			success: request.flash( "success" ),
			vErrors: request.flash( "vErrors" ),
			auth: request.session,
			config: config
		} );
	};

	module.changepasswordPost = async function ( request, response ) {
		var emailId = request.session.admin.email_id;
		var oldpassword = md5( request.body.oldpassword );
		var newpassword = md5( request.body.newpassword );

		try {
			var userDetail = await model.User.findOne( { where: { 'email_id': emailId, 'password': oldpassword } } );
			if ( userDetail != null ) {
				var updateData = await userDetail.update( { password: newpassword } );
				request.flash( 'success', "Password change successfully." );
				response.redirect( '/backend/dashboard' );
			} else {
				request.flash( 'error', "Old password is wrong" );
				response.redirect( '/backend/changepassword' );
			}
		} catch ( err ) {
			console.log( "Password change error: ", err );
			request.flash( 'error', "Password not change, please try again" );
			response.redirect( '/backend/changepassword' );
		}
	};
	return module;
};


function generatePassword ( length ) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyz#$%^&@';
	var result = '';
	for ( var i = length; i > 0; --i ) result += chars[ Math.floor( Math.random() * chars.length ) ];
	return result;
}