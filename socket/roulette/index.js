var flag = true;
module.exports = function ( model, io, client ) {
	var config = require( '../../config/constants.js' );
	var roulette = require( './roulette' )( model, config );

	updateRouletteUser();
	if ( flag == true ) {
		flag = false;
		gameStartCountDown();
	}

	function updateRouletteUser () {
		roulette.updateRouletteUser( {}, function ( response ) { } );
	}

	function gameStartCountDown () {
		io.emit( "rouletteClearBetPlayer", {} );
		roulette.gameCount( function ( response ) {
			if ( response.status == "success" ) {
				io.emit( 'rouletteStartCountDown', response );
			}
			if ( response.status == "start" ) {
				rouletteGameLogic();
			}
			if ( response.status == "restart" ) {
				flag = false;
				gameStartCountDown();
			}
		} );
	}

	//START : Roulette game betting start
	client.on( 'bettingStart', function ( data, callback ) {
		// console.log('bettingStart --ON--');
		// console.log('data  -->', data);

		roulette.bettingStart( data, function ( response ) {
			callback( response );
		} );
	} );
	//END : Roulette game betting start

	function rouletteGameLogic () {
		roulette.rouletteLogic( function ( response ) {
			if ( response.status == "success" ) {
				flag = false;
				gameStartCountDown();
			}
		} );
	}

};	