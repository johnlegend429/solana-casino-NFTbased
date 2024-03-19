module.exports = function ( Sequelize, Schema ) {
	User = require( './user' )( Sequelize, Schema );

	var Chat = Schema.define( 'chat_master', {
		chat_message: {
			type: Sequelize.TEXT
		},
		anymos: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		},
		is_deleted: {
			type: Sequelize.ENUM( '1', '0' ), defaultValue: '0'
		}
	}, { underscored: true } );

	Chat.belongsTo( User, { foreignKey: 'user_id', as: 'userDetail' } );
	Chat.sync( { force: false } );
	return Chat;
};