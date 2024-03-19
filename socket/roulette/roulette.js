const Op = Sequelize.Op;
var sequelize = require( '../../config/database.js' )( Sequelize );
var req = require( "request" );
var sha256 = require( 'js-sha256' ).sha256;
var converter = require( 'hex2dec' );
const { log } = require( 'winston' );
const { raw } = require( 'body-parser' );

module.exports = function ( model, config ) {
	let gameStartCount = config.rouletteStartTime;
	var module = {};
	module.gameCount = async function ( callback ) {
		try {
			var gamaStartInterval = setInterval( function () {
				var data = {};
				model.Roulette.findOne( { attributes: [ "id" ], where: { game_status: { [ Op.ne ]: 'completed' } } } ).then( gameRes => {
					if ( gameRes != null ) {
						var rouletteId = gameRes.id;
						module.gameCountDown( gamaStartInterval, rouletteId, function ( response ) {
							return callback( response );
						} );
					}
				} ).catch( function ( err ) {
					var gameCount = { "status": "fail" };
					clearInterval( gamaStartInterval );
					return callback( gameCount );
				} );
			}, 1000 /* 100 - counting chnages*/ );
			// console.log('gamaStartInterval -->', gamaStartInterval); 
		} catch ( error ) {
			console.log( "Error when game start count down start: ", error );
		}
	};

	module.gameCountDown = function ( gamaStartInterval, rouletteId, callback ) {
		model.RouletteHistory.count( { where: { 'roulette_id': rouletteId } } ).then( historyResult => {
			if ( gameStartCount <= 0.0 ) {
				clearInterval( gamaStartInterval );
				gameStartCount = config.rouletteStartTime;
				return callback( { "status": "start" } );

			} else {
				let width = ( config.rouletteStartTime - gameStartCount ) / parseFloat( config.rouletteStartTime ) * 100;
				var response = { "status": "success", "count": gameStartCount, width: width };
				gameStartCount -= 1;
				return callback( response );
			}
		} ).catch( function ( historyErr ) {
			console.log( "crash game count interval game history not available: ", historyErr );
		} );
	};

	module.rouletteLogic = async function ( callback ) {
		try {

			var getrouletteDetail = await model.Roulette.findOne( { attributes: [ 'id', 'admin_commission_price', 'game_hash', 'hash_salt', 'round_number' ], where: { game_status: 'pending' } } );
			var rouletteId = getrouletteDetail.id;
			let rouletteHistoryDetail = await sequelize.query( "SELECT selected_color,sum(winning_amount) as winning_amount FROM roulette_histories WHERE roulette_id=" + rouletteId + " GROUP BY selected_color", { type: sequelize.QueryTypes.SELECT } );

			var gameNumber = helper.getNextIntNumber( getrouletteDetail.game_number );
			var roundNumber = helper.randomFloat();


			let public_seed = helper.randomOnlyNumber( 10 );
			let server_seed = helper.randomString( 64 );

			var gameSecret = public_seed;
			var hashSalt = server_seed;
			var gameHash = sha256( gameSecret + "-" + hashSalt + "-" + gameNumber );


			await model.Roulette.update( {
				hash_salt: hashSalt,
				game_hash: gameHash,
				round_number: roundNumber,
			}, { where: { id: rouletteId } } );


			var cases = getCase();
			// console.log('cases -->', cases.length);
			cases = shuffle( cases );

			var dangerArray = [];
			var greyArray = [];
			var successArray = [];
			for ( var x = 0; x < cases.length; x++ ) {
				if ( cases[ x ][ 1 ] == 1 || cases[ x ][ 1 ] == 3 || cases[ x ][ 1 ] == 5 || cases[ x ][ 1 ] == 7 || cases[ x ][ 1 ] == 9 || cases[ x ][ 1 ] == 11 || cases[ x ][ 1 ] == 13 ) {
					dangerArray.push( cases[ x ] );
				} else if ( cases[ x ][ 1 ] == 2 || cases[ x ][ 1 ] == 4 || cases[ x ][ 1 ] == 6 || cases[ x ][ 1 ] == 8 || cases[ x ][ 1 ] == 10 || cases[ x ][ 1 ] == 12 || cases[ x ][ 1 ] == 14 ) {
					greyArray.push( cases[ x ] );
				} else if ( cases[ x ][ 1 ] == 0 ) {
					successArray.push( cases[ x ] );
				}
			}
			var arr3 = [];
			for ( var y = 0, len = dangerArray.length; y < len; y++ ) {
				if ( arr3.length == 74 ) {
					arr3[ 74 ] = successArray[ 0 ];
					y--;
				} else {
					arr3[ arr3.length ] = dangerArray[ y ];
				}
				if ( arr3.length == 74 ) {
					arr3[ 74 ] = successArray[ 0 ];
					y--;
				} else {
					arr3[ arr3.length ] = greyArray[ y ];
				}
			}
			cases = arr3;
			// console.log('cases suffle -->', cases);

			var hash1 = gameHash.substr( 0, 8 );
			var rolls = converter.hexToDec( hash1 );
			var roll = rolls % 15;

			var roll_colour = '';
			var wamt = '';
			if ( roll == 0 ) {
				roll_colour = 'green';
				wamt = config.WonGreenMultiplier;
			} else if ( roll == 1 || roll == 3 || roll == 5 || roll == 7 || roll == 9 || roll == 11 || roll == 13 ) {
				roll_colour = 'danger';
				wamt = config.WonDangerMultiplier;
			} else if ( roll == 2 || roll == 4 || roll == 6 || roll == 8 || roll == 10 || roll == 12 || roll == 14 ) {
				roll_colour = 'black';
				wamt = config.WonGreyMultiplier;
			}


			var checkamt = parseFloat( getrouletteDetail.bet_amount ) + parseFloat( getrouletteDetail.total_amt_carryforward );
			var getStopColor = await model.RouletteHistory.findAll( { where: { roulette_id: rouletteId, selected_color: roll_colour }, attributes: [ [ Sequelize.fn( 'sum', Sequelize.col( 'bet_amount' ) ), 'bet_amount' ] ], raw: true } );


			if ( getStopColor[ 0 ].bet_amount != null ) {
				var totalWinAmt = parseFloat( getStopColor[ 0 ].bet_amount ) * parseInt( wamt );
				if ( checkamt < totalWinAmt ) {
					if ( roll_colour == 'danger' ) {
						var myArray = [ "black", "green" ];
					} else if ( roll_colour == 'black' ) {
						var myArray = [ "danger", "green" ];
					} else if ( roll_colour == 'green' ) {
						var myArray = [ "danger", "black" ];
					}
					roll_colour = myArray[ Math.floor( Math.random() * myArray.length ) ];
				}
			}

			var winColor = [ roll_colour /* "green" */ ];
			// console.log('winColor -->', winColor);
			var winColorClassObj = { "black": "dark-gradiant", "green": "success-gradiant", "danger": "danger-gradiant" };
			let rouletteStopPosition = Math.rand( 6190, 6270 );
			let winData = '';
			let minWonAmt = 0;


			if ( winColor.length ) {
				var winnerColor = winColor[ 0 ];
				if ( winnerColor == "green" ) {
					// rouletteStopPosition = Math.rand(/* 6570,6640 */ 6438,6448 );
					rouletteStopPosition = 6441;
					console.log( 'rouletteStopPosition -->', rouletteStopPosition );
					var replacenumber = cases[ 74 ];
					replacenumber[ replacenumber.indexOf( replacenumber[ 1 ] ) ] = roll.toString();
					replacenumber[ replacenumber.indexOf( replacenumber[ 0 ] ) ] = 'success-gradiant';
					winData = replacenumber;
					console.log( 'winData -->', winData );
					console.log( '-----------------------------------------' );
				} else if ( winnerColor == "black" ) {
					// rouletteStopPosition = Math.rand( /* 6100,6170 */ 5970,5980 );
					rouletteStopPosition = 5970;
					console.log( 'rouletteStopPosition -->', rouletteStopPosition );
					var replacenumber = cases[ 69 ];
					replacenumber[ replacenumber.indexOf( replacenumber[ 1 ] ) ] = roll.toString();
					replacenumber[ replacenumber.indexOf( replacenumber[ 0 ] ) ] = 'dark-gradiant';
					winData = replacenumber;
					console.log( 'winData -->', winData );
					console.log( '-------------------------------------------' );
				} else if ( winnerColor == "danger" ) {
					// rouletteStopPosition = Math.rand(/* 6190,6270 */ 6064,6074 );
					rouletteStopPosition = 6066;
					console.log( 'rouletteStopPosition -->', rouletteStopPosition );
					var replacenumber = cases[ 70 ];
					replacenumber[ replacenumber.indexOf( replacenumber[ 1 ] ) ] = roll.toString();
					replacenumber[ replacenumber.indexOf( replacenumber[ 0 ] ) ] = 'danger-gradiant';
					winData = replacenumber;
					console.log( 'winData -->', winData );
					console.log( '------------------------------------------' );
				}
				let winColorClass = winColorClassObj[ winnerColor ];
			}

			var stoppedOnNumber = winData[ 1 ];
			let gameStoppedOn = 'black';
			let wonMultiplier = 0;
			if ( winData[ 0 ] == 'danger-gradiant' ) {
				wonMultiplier = config.WonDangerMultiplier;
				gameStoppedOn = 'danger';
			} else if ( winData[ 0 ] == 'dark-gradiant' ) {
				wonMultiplier = config.WonGreyMultiplier;
				gameStoppedOn = 'black';
			} else if ( winData[ 0 ] == "success-gradiant" ) {
				gameStoppedOn = 'green';
				wonMultiplier = config.WonGreenMultiplier;
			}

			await model.RouletteHistory.update( { is_won: "yes", winning_amount: Sequelize.literal( 'bet_amount * ' + wonMultiplier ) }, { where: { roulette_id: rouletteId, selected_color: gameStoppedOn } } );
			var userWinBalance = await model.RouletteHistory.findAll( { where: { roulette_id: rouletteId, is_won: 'yes' } } );

			for ( let j = 0; j < userWinBalance.length; j++ ) {
				minWonAmt += parseFloat( userWinBalance[ j ].winning_amount );
				var userDetail = await model.User.findByPk( userWinBalance[ j ].dataValues.user_id );
				var totalBalanceUpdate = parseFloat( userDetail.dataValues.main_balance ) + parseFloat( userWinBalance[ j ].dataValues.winning_amount );
				await userDetail.update( { 'main_balance': totalBalanceUpdate } );
			}

			var rouletteResponse = {
				status: "success",
				cases: cases,
				rouletteRotateDuration: config.rouletteRotateDuration,
				stopPosition: rouletteStopPosition,
				winnerColor: winnerColor
			};
			io.emit( "rouletteGameStarted", rouletteResponse );

			setTimeout( async function () {

				let wonUser = await sequelize.query( "SELECT rh.id as history_id,um.main_balance,um.jwt_login_token as user_id,um.name,rh.selected_color,rh.bet_amount FROM user_masters um JOIN roulette_histories rh ON um.id=rh.user_id WHERE rh.roulette_id=" + rouletteId, { type: sequelize.QueryTypes.SELECT } );
				io.emit( "rouletteWonUser", wonUser );

				var currentGameGetAllUSer = await model.RouletteHistory.findAll( { where: { roulette_id: rouletteId } } );
				// console.log('currentGameGetAllUSer -->', currentGameGetAllUSer);
				io.emit( "showNotification", currentGameGetAllUSer );

				var settingDetail = await model.Setting.findOne().then( settingRes => {
					return settingRes;
				} );

				if ( rouletteHistoryDetail.length ) {

					var rouletteDetail = await model.Roulette.findOne( { where: { id: rouletteId } } );

					var getadminCommission = parseFloat( rouletteDetail.dataValues.bet_amount ) * parseFloat( settingDetail.roulette_admin_commission );
					var adminCommission = parseFloat( getadminCommission ) / 100;
					var adminPer = parseFloat( adminCommission ) / parseFloat( settingDetail.chips );

					var adminCOmAfteramt = parseFloat( rouletteDetail.dataValues.bet_amount ) - parseFloat( adminCommission );
					var getremaining = parseFloat( adminCOmAfteramt ) + parseFloat( rouletteDetail.dataValues.total_amt_carryforward );
					var finalremaining = parseFloat( getremaining ) - parseFloat( minWonAmt );

					console.log( 'data -->',
						stoppedOnNumber,
						gameStoppedOn,
						adminPer,
						adminCommission,
						settingDetail.chips
					);

					var updateHistory = await model.Roulette.update( {
						game_stopped_number: stoppedOnNumber,
						game_status: "completed",
						game_stopped_on: gameStoppedOn,
						admin_commission_dollar: adminPer,
						admin_commission_price: adminCommission,
						dollar_price_in_coins: settingDetail.chips
					}, { where: { id: rouletteId } } );
					console.log( 'updateHistory -->', updateHistory );

					if ( wonUser.length ) {
						var uID = wonUser[ 0 ].user_id;
					}
					var getSeedData = await model.User.findOne( { where: { jwt_login_token: uID }, limit: 1, raw: true } );
					if ( getSeedData ) {
						var seedData = {
							serverSeed: getSeedData.server_seed,
							clientSeed: getSeedData.client_seed,
							nonce: getSeedData.nonce,
						};
					}
					io.emit( "afterOverBetOnChangesSeedData", seedData );

					let joinedUser = await sequelize.query( "SELECT rh.id as history_id,um.id as user_id,um.name,um.profile_image,um.socket_id,rh.selected_color,rh.bet_amount FROM user_masters um JOIN roulette_histories rh ON um.id=rh.user_id WHERE rh.roulette_id=" + rouletteId, { type: sequelize.QueryTypes.SELECT } );
					console.log( 'joinedUser -->', joinedUser );

					// if (joinedUser) {
					console.log( '------joinedUser------' );
					var UID = joinedUser[ 0 ].user_id;
					console.log( 'UID -->', UID );
					// let getLatestHistory = await model.Roulette.findAll({where:{game_status:"completed"},limit:5,order:[['id','DESC']],raw: true});
					var getLatestHistory = await sequelize.query( "SELECT rh.user_id, rh.roulette_id, rm.game_stopped_number, rm.game_stopped_on FROM roulette_histories rh JOIN roulette_masters rm ON rm.id=rh.roulette_id WHERE rh.user_id=" + UID + " ORDER BY rh.id DESC LIMIT 5", { type: sequelize.QueryTypes.SELECT } );
					// io.emit("rouletteStoppedUpdate", getLatestHistory);

					joinedUser.map( usr => {
						io.to( usr.socket_id ).emit( "rouletteStoppedUpdate", getLatestHistory );
					} );

					// }


					// io.emit("rouletteStoppedUpdate",getLatestHistory);


					var rouletteData = {
						'game_number': gameNumber,
						'round_number': roundNumber,
						'game_secret': gameSecret,
						'game_hash': gameHash,
						'hash_salt': hashSalt,
						'total_amt_carryforward': finalremaining
					};
					await model.Roulette.create( rouletteData ).catch( e => {
						console.log( e );
					} );
				}
				return callback( { status: "success" } );
			}, config.rouletteRotateDuration + 3000 );

			return callback( { status: "started" } );
		} catch ( err ) {
			console.log( err );
		}
	};

	module.bettingStart = async function ( data, callback ) {
		try {

			var userId = data.user_id;
			// console.log('userId---------->', userId);
			var betAmount = data.bet_amount;
			// console.log('betAmount -->',betAmount);
			var btn_clicks = data.btn_click;
			// console.log('btn_clicks -->', btn_clicks);

			if ( userId < 0 ) {
				return callback( { 'status': 'fail', 'message': 'Please log in to Play' } );
			}
			if ( betAmount == "" ) {
				return callback( { 'status': 'fail', 'message': 'Please enter bet amount' } );
			}
			if ( isNaN( betAmount ) ) {
				return callback( { 'status': 'fail', 'message': 'Please enter valid bet amount' } );
			}

			if ( betAmount <= 0 ) {
				return callback( { 'status': 'fail', 'message': 'Please enter valid bet amount' } );
			}

			var settingDetail = await model.Setting.findOne().then( settingRes => {
				return settingRes;
			} );

			if ( parseInt( betAmount ) < parseInt( settingDetail.min_bet ) ) {
				return callback( { 'status': 'fail', 'message': 'Please enter minimum bet amount ' + settingDetail.min_bet } );
			}

			if ( parseInt( betAmount ) > parseInt( settingDetail.max_bet ) ) {
				return callback( { 'status': 'fail', 'message': 'Please enter Valid amount. Amount should not be greater than ' + settingDetail.max_bet } );
			}

			var userDetail = await model.User.findOne( { where: { "jwt_login_token": userId }, raw: true }, );
			// console.log('userDetail -->', userDetail);

			if ( !userDetail ) {
				return callback( { 'status': 'fail', 'message': 'User not found' } );
			}
			if ( userDetail.status == 0 ) {
				return callback( { 'status': 'fail', 'message': 'You have been banned. Please contact to admin' } );
			}
			if ( userDetail.is_login == 0 ) {
				return callback( { 'status': 'fail', 'message': 'User data not found. Please log in to Play.' } );
			}

			if ( userDetail.is_deleted == '1' ) {
				return callback( { 'status': 'fail', 'message': 'Your account deleted from admin side. please contact to admin.' } );
			}

			var rouletteDetail = await model.Roulette.findOne( { attributes: [ 'id' ], where: { game_status: 'pending' } } );
			// console.log('rouletteDetail -->', rouletteDetail);

			if ( !rouletteDetail ) {
				return callback( { status: "fail", message: "Roulette game already started" } );
			}
			// console.log("user balance -->",userDetail.main_balance)
			// console.log("betAmount -->",betAmount)
			if ( parseFloat( userDetail.main_balance ) < parseFloat( betAmount ) ) {
				return callback( { status: "fail", message: "Insufficient balance to play game" } );
			}

			var rouletteId = rouletteDetail.id;
			// console.log('rouletteId -->', rouletteId);

			var perRoundUserBetLimit = await model.RouletteHistory.findAll( { where: { roulette_id: rouletteId, user_id: userDetail.id } } );
			// console.log('perRoundUserBetLimit -->', perRoundUserBetLimit);
			var roulette_data = perRoundUserBetLimit.length;
			// console.log('roulette_data -->', roulette_data);
			// console.log('config -->', config);
			// console.log('config.roulettePerRoundBet -->',config.roulettePerRoundBet);

			if ( roulette_data == config.roulettePerRoundBet ) {
				return callback( { status: "fail", message: "You can place only " + config.roulettePerRoundBet + " bets per round" } );
			}

			//Update total betamount of game
			var UpdatetotalBetamountOfGame = await model.Roulette.update( { bet_amount: Sequelize.literal( 'bet_amount + ' + betAmount ) }, { where: { id: rouletteId } } );
			// console.log('UpdatetotalBetamountOfGame -->', UpdatetotalBetamountOfGame);

			//Minus  mainbalance of user
			var MinusmainbalanceOfUser = await model.User.update( { main_balance: Sequelize.literal( 'main_balance - ' + betAmount ) }, { where: { id: userDetail.id } } );
			// console.log('MinusmainbalanceOfUser -->', MinusmainbalanceOfUser);

			let userBalance = parseFloat( userDetail.main_balance ) - parseFloat( betAmount );
			// console.log('userBalance -->', userBalance);

			io.emit( "rouletteBalanceAfterBet", { main_balance: parseFloat( userBalance ).toFixed( 2 ), user_id: userDetail.jwt_login_token } );

			let wonMultiplier = 0;
			if ( btn_clicks == 'danger' ) {
				wonMultiplier = config.WonDangerMultiplier;
			} else if ( btn_clicks == 'grey' ) {
				wonMultiplier = config.WonGreyMultiplier;
			} else if ( btn_clicks == "green" ) {
				wonMultiplier = config.WonGreenMultiplier;
			}


			if ( btn_clicks == 'grey' ) {
				btn_click = 'black';
			} else {
				btn_click = btn_clicks;
			}

			var updateSeed = await model.User.update( {
				nonce: userDetail.nonce + 1
			},
				{ where: { id: userDetail.id } }
			);
			/* console.log('updateSeed -->', updateSeed);

			console.log('userDetail.client_seed -->', userDetail.client_seed);
			console.log('userDetail.server_seed -->', userDetail.server_seed); */

			var rouletteData = {
				'bet_amount': betAmount,
				'selected_color': btn_click,
				'roulette_id': rouletteId,
				'user_id': userDetail.id,
				'winning_amount': betAmount * wonMultiplier,
				'client_seed': userDetail.client_seed,
				'server_seed': userDetail.server_seed,
				'nonce': userDetail.nonce + 1
			};
			var createRoullteHistory = await model.RouletteHistory.create( rouletteData, { raw: true } );
			// console.log('createRoullteHistory -->', createRoullteHistory);

			let joinedUser = await sequelize.query( "SELECT rh.id as history_id,um.id as user_id,um.name,um.profile_image,rh.selected_color,rh.bet_amount FROM user_masters um JOIN roulette_histories rh ON um.id=rh.user_id WHERE rh.roulette_id=" + rouletteId, { type: sequelize.QueryTypes.SELECT } );
			// console.log('joinedUser -->', joinedUser);

			io.emit( "rouletteJoinedByUser", joinedUser );
			return callback( { 'status': 'success', 'message': 'Bet placed successfully' } );

		} catch ( error ) {
			console.log( "try catch", error );
			return callback( { 'status': 'fail', 'message': 'Game not available' } );
		}
	};

	module.muteUnmuteVolume = async function ( data, callback ) {
		try {
			var userId = data.user_id;
			var btnvL = data.btnvL;
			if ( userId != 0 && userId != undefined && userId != "" ) {
				var userDetail = await model.User.findOne( { where: { "jwt_login_token": userId } } );
				if ( userDetail != null ) {
					await userDetail.update( { 'volumeStatus': btnvL } );
					return callback( { 'status': 'success' } );
				} else {
					console.log( "Error when user decline insurance game detail not available" );
					return callback( { 'status': 'fail' } );
				}
			}
		} catch ( error ) {
			console.log( "Error when insurance decline by user: ", error );
		}
	};

	module.updateRouletteUser = async function ( data, callback ) {
		var rouletteDetail = await model.Roulette.findOne( { attributes: [ 'id' ], where: { game_status: 'pending' } } );
		if ( !rouletteDetail ) {
			return callback( { status: "fail", message: "Roulette game already started" } );
		}
		var rouletteId = rouletteDetail.id;
		let joinedUser = await sequelize.query( "SELECT rh.id as history_id,um.id as user_id,um.name,um.profile_image,rh.selected_color,rh.bet_amount FROM user_masters um JOIN roulette_histories rh ON um.id=rh.user_id WHERE rh.roulette_id=" + rouletteId, { type: sequelize.QueryTypes.SELECT } );
		io.emit( "rouletteJoinedByUser", joinedUser );
		return callback( { status: "success", message: "Roulette user updated successfully" } );
	};

	return module;
};


function shuffle ( array ) {
	var currentIndex = array.length, temporaryValue, randomIndex;
	while ( 0 !== currentIndex ) {
		randomIndex = Math.floor( Math.random() * currentIndex );
		currentIndex -= 1;
		temporaryValue = array[ currentIndex ];
		array[ currentIndex ] = array[ randomIndex ];
		array[ randomIndex ] = temporaryValue;
	}
	return array;
}


Math.rand = function getRandomInt ( min, max ) {
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
};


function getCase () {
	var cases = [
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "2" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "5" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "6" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "11" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "13" ],
		[ "success-gradiant", "0" ],
		[ "dark-gradiant", "2" ],
		[ "danger-gradiant", "11" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "9" ],
		[ "dark-gradiant", "4" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "5" ],
		[ "success-gradiant", "0" ],
		[ "dark-gradiant", "4" ],
		[ "danger-gradiant", "5" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "9" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "2" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "1" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "5" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "9" ],
		[ "dark-gradiant", "6" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "11" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "13" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "12" ],
		[ "dark-gradiant", "2" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "10" ],
		[ "danger-gradiant", "5" ],
		[ "dark-gradiant", "6" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "9" ],
		[ "dark-gradiant", "2" ],
		[ "danger-gradiant", "7" ],
		[ "dark-gradiant", "12" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "14" ],
		[ "dark-gradiant", "8" ],
		[ "dark-gradiant", "10" ],
		[ "dark-gradiant", "12" ],
		[ "dark-gradiant", "2" ],
		[ "dark-gradiant", "8" ],
		[ "dark-gradiant", "6" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "1" ],
		[ "danger-gradiant", "3" ],
		[ "danger-gradiant", "5" ],
		[ "danger-gradiant", "7" ],
		[ "danger-gradiant", "9" ],
		[ "dark-gradiant", "14" ],
		[ "danger-gradiant", "11" ],
		[ "dark-gradiant", "4" ],
		[ "danger-gradiant", "13" ],
		[ "dark-gradiant", "8" ],
		[ "danger-gradiant", "3" ],
		[ "dark-gradiant", "2" ],
	];
	return cases;
}