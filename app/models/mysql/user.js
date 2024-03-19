module.exports = function ( Sequelize, Schema ) {
	var User = Schema.define( 'user_master', {
		jwt_login_token: {
			type: Sequelize.STRING
		},
		name: {
			type: Sequelize.STRING
		},
		email_id: {
			type: Sequelize.STRING
		},
		password: {
			type: Sequelize.STRING
		},
		user_wallet_id: {
			type: Sequelize.STRING
		},
		main_balance: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		total_deposite: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		total_withdraw: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		total_game_deposite: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		total_win_amount: {
			type: Sequelize.DECIMAL( 10, 2 ), defaultValue: 0.00
		},
		profile_image: {
			type: Sequelize.STRING, defaultValue: 'profile-main.png'
		},
		password_token: {
			type: Sequelize.STRING
		},
		is_login: {
			type: Sequelize.ENUM( '1', '0' )
		},
		is_moderator: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		user_can_chat: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '1'
		},
		user_ban_unban_chat: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		type: {
			type: Sequelize.ENUM( 'admin', 'user', 'subadmin' ), defaultValue: 'user'
		},
		status: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '1'
		},
		is_deleted: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		anymos: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		over_18_years: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		user_rank: {
			type: Sequelize.STRING
		},
		moderator_type: {
			type: Sequelize.ENUM( 'user', 'moderator' ), defaultValue: 'user'
		},
		volume_status: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		socket_id: {
			type: Sequelize.STRING, defaultValue: ''
		},
		client_seed: {
			type: Sequelize.STRING
		},
		server_seed: {
			type: Sequelize.STRING
		},
		nonce: {
			type: Sequelize.BIGINT
		},
	}, { underscored: true } );

	User.sync( { force: false } );

	return User;
};