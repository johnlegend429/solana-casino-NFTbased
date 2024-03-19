var Op = Sequelize.Op;
var md5 = require( 'md5' );
var nodemailer = require( 'nodemailer' );
var jwt = require( 'jsonwebtoken' );
const web3 = require( "@solana/web3.js" );

module.exports = function ( model, config ) {
	var module = {};

	module.login = async function ( req, res ) {
		try {
			console.log( 'walletID -->', req.body.walletId );
			var userData = await model.User.findOne( { where: { 'user_wallet_id': req.body.walletId }, raw: true } ).then( data => {
				return data;
			} );
			// console.log('userData --->', userData);

			if ( userData == null ) {
				console.log( 'New register......' );
				var clientseed = helper.randomString( 20 );
				var serverSeed = helper.createSecretkey( clientseed );

				var createUSer = {
					user_wallet_id: req.body.walletId,
					client_seed: clientseed,
					server_seed: serverSeed,
					nonce: 0,
					name: await GetUserName(),
				};
				var createUser = await model.User.create( createUSer );
				console.log( 'createUser -->', createUser );
				req.session.user = createUser;
				var token = jwt.sign( { data: createUser.id }, config.jwt_secret, { expiresIn: config.jwt_expire } );
				console.log( 'token -->', token );
				var userUpdate = await model.User.update( { is_login: "1", "jwt_login_token": token }, { where: { id: createUser.id } } );
				console.log( 'userUpdate -->', userUpdate );
				createUser.jwt_login_token = token;
				return res.send( JSON.stringify( { "status": 'success', 'message': 'Login successfully' } ) );
			} else {
				console.log( 'Already login......' );
				var clientseed = helper.randomString( 20 );
				var serverSeed = helper.createSecretkey( clientseed );
				console.log( 'userData.client_seed -->', userData.client_seed );
				console.log( 'userData.server_seed -->', userData.server_seed );

				if ( userData.client_seed == '' ) {
					var clSeed = { client_seed: clientseed };
					var updateClientseed = await model.User.update( clSeed, { where: { id: userData.id } } );
					console.log( 'updateClientseed -->', updateClientseed );
				}
				if ( userData.server_seed == '' ) {
					var srSeed = { server_seed: serverSeed };
					var updateServerseed = await model.User.update( srSeed, { where: { id: userData.id } } );
					console.log( 'updateServerseed -->', updateServerseed );
				}
				if ( userData.is_deleted == '1' ) {
					return res.send( JSON.stringify( { "status": 'fail', 'message': 'Your account deleted from admin side. please contact to admin.' } ) );
				}
				if ( userData.status == '0' ) {
					return res.send( JSON.stringify( { "status": 'fail', 'message': 'Your account ban from admin side. please contact to admin.' } ) );
				}

				req.session.user = userData;

				var token = jwt.sign( { data: userData.id }, config.jwt_secret, { expiresIn: config.jwt_expire } );
				console.log( 'token --->', token );

				var userUpdate = await model.User.update( { is_login: "1", "jwt_login_token": token }, { where: { id: userData.id } } );
				console.log( 'userUpdate -->', userUpdate );

				// console.log('userData --->', userData);

				userData.jwt_login_token = token;
				return res.send( JSON.stringify( { "status": 'success', 'message': 'Login successfully' } ) );

			}
		} catch ( error ) {

			console.log( error );
			return res.send( JSON.stringify( { "status": 'fail', 'message': 'Something is wrong try again.' } ) );
		}
	};

	module.logout = async function ( req, res ) {
		let userData = req.session.user;
		await model.User.update( { is_login: "0" }, { where: { id: userData.id } } );
		delete req.session.user;
		req.flash( 'success', "Logout successfully" );
		res.redirect( '/' );
	};

	return module;
};

function GetUserName () {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for ( var i = 0; i < 5; i++ )
		text += possible.charAt( Math.floor( Math.random() * possible.length ) );
	return text;
}