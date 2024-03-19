// var dateFormat = require('dateformat');
var dateFormat = require( 'moment' );
let Op = Sequelize.Op;

// var Coinpayments = require('coinpayments');
// var freeKass = require('../../helpers/FreekassaHelper');

module.exports = function ( model, config ) {
    var module = {};
    var options = {
        key: '124daa672390135dff492559ce511b6d453dc8a2c743b3aaa40c3b32d242628b',
        secret: '44EEf0ab2E0Adb86309BCA919D76Db63d09De4df9bc00d48a9AB5056E96b2af0',
        autoIpn: true
    };
    // var client = new Coinpayments(options);
    // var objFreeKassa = new freeKass();

    module.view = async function ( req, res ) {
        try {
            if ( req.session.user.id ) {
                var userId = req.session.user.id;

                var userDetail = await model.User.findByPk( userId ).then( userRes => {
                    return userRes;
                } );

                // console.log('userDetail >>--<> ',userDetail)


                var withdrawList = await model.Withdraw.findAll( {
                    where: { 'user_id': userId }, order: [ [ 'id', 'DESC' ], ], raw: true
                } ).then( withdrawRes => {
                    for ( var i = 0; i < withdrawRes.length; i++ ) {
                        console.log( 'wl succ' );
                        withdrawRes[ i ].transaction_date = dateFormat( withdrawRes[ i ].transaction_date, 'mm/dd/yyyy' );
                    }
                    return withdrawRes;
                } ).catch( function ( error ) {
                    console.log( "errorr: ", error );
                } );

                console.log( 'withdrawList >>--<> ', withdrawList );


                if ( userDetail !== null ) {
                    res.render( 'frontend/withdraw', {
                        error: req.flash( "error" ),
                        success: req.flash( "success" ),
                        vErrors: req.flash( "vErrors" ),
                        auth: req.session,
                        config: config,
                        alias: 'withdraw',
                        userDetail: userDetail,
                        withdrawList: withdrawList
                    } );
                } else {
                    req.flash( 'error', "Please login." );
                    res.redirect( '/login' );
                }
            } else {
                console.log( 'error please login' );
                req.flash( 'error', "Please login." );
                res.redirect( '/login' );
            }
        } catch ( error ) {
            res.redirect( '/' );
        }
    };

    module.checkcoin = async function ( req, res ) {
        try {
            var coin = req.body.coin;
            var currencyType = req.body.currency_type;

            if ( coin != "" && coin != 0 ) {
                if ( currencyType != "" && currencyType != null && currencyType != undefined ) {
                    var message = "You getting amount " + parseFloat( coin ).toFixed( 2 ) + " " + currencyType;
                    res.send( JSON.stringify( { status: "success", message: message } ) );
                } else {
                    res.send( JSON.stringify( { status: "fail", message: "Please select currency type." } ) );
                }
            }
        } catch ( error ) {
            console.log( "Error when withdraw coin check: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please select currency type." } ) );
        }
    };

    module.create = async function ( req, res ) {
        try {
            if ( req.session.user ) {
                var userId = req.session.user.id;
                if ( userId !== "" && userId !== 0 ) {
                    var userDetail = await model.User.findByPk( userId ).then( userRes => {
                        return userRes;
                    } ).catch( function ( userErr ) {
                        req.flash( 'error', "Some problem please try after sometime" );
                        res.redirect( '/login' );
                    } );

                    if ( userDetail !== null ) {
                        var coin = req.body.coin;
                        var currencyType = req.body.currency_type;
                        if ( currencyType !== null && currencyType !== "" ) {
                            if ( coin !== "" && coin !== 0 ) {
                                if ( parseFloat( coin ) <= parseFloat( userDetail.main_balance ) ) {
                                    var settingDetail = await model.Setting.findByPk( 1 ).then( settingRes => {
                                        return settingRes;
                                    } ).catch( function ( settingErr ) {
                                        console.log( "Error when user deposit coin get setting error: ", settingErr );
                                        res.send( JSON.stringify( {
                                            status: "fail",
                                            message: "Withdraw under maintenance, please try after some time."
                                        } ) );
                                    } );

                                    if ( settingDetail !== null ) {

                                        if ( currencyType === "btc" || currencyType === "BTC" ) {
                                            var amount = coin * parseFloat( settingDetail.withdraw_btc_coin );
                                            var address = userDetail.ltc_currency_address;
                                            var withdrawMinCoin = settingDetail.ltc_withdraw_min_coin;
                                            var coinType = "BTC";
                                        }

                                        if ( parseFloat( coin ) > parseFloat( withdrawMinCoin ) ) {
                                            if ( address !== "" && address !== null ) {
                                                client.createWithdrawal( {
                                                    'currency': currencyType, 'amount': amount, 'address': address
                                                }, function ( withdarwErr, withdrawRes ) {

                                                    if ( withdrawRes !== undefined ) {
                                                        var now = new Date();
                                                        var withdrawData = {
                                                            price: withdrawRes.amount,
                                                            coin: coin,
                                                            coin_type: coinType,
                                                            user_id: userId,
                                                            transaction_id: withdrawRes.id,
                                                            status: withdrawRes.status,
                                                            transaction_date: dateFormat( now, "yyyy-mm-dd HH:MM:ss" )
                                                        };

                                                        model.Withdraw.create( withdrawData ).then( withdraw => {
                                                            model.User.update( {
                                                                total_withdraw: Sequelize.literal( 'total_withdraw + ' + coin ),
                                                                main_balance: Sequelize.literal( 'main_balance - ' + coin )
                                                            }, { where: { id: userId } } ).then( userCoin => {
                                                                model.User.findByPk( userId ).then( userDetail => {
                                                                    req.session.user = userDetail;
                                                                    res.send( JSON.stringify( {
                                                                        status: "success",
                                                                        message: "Withdraw successfully",
                                                                        data: userDetail.main_balance
                                                                    } ) );
                                                                    console.log( "User coin withdraw update in user tabel: {user_id=" + userId + " coin=" + coin + "}" );
                                                                } );
                                                            } );
                                                        } );
                                                    } else {
                                                        console.log( "Error when withdraw response: ", withdarwErr );
                                                        res.send( JSON.stringify( {
                                                            status: "fail", message: withdarwErr
                                                        } ) );
                                                    }
                                                } );
                                            } else {
                                                res.send( JSON.stringify( {
                                                    status: "fail",
                                                    message: "Please enter withdraw address from your profile."
                                                } ) );
                                            }
                                        } else {
                                            res.send( JSON.stringify( {
                                                status: "fail", message: "Minimum withdraw coin is " + withdrawMinCoin
                                            } ) );
                                        }
                                    } else {
                                        res.send( JSON.stringify( {
                                            status: "fail",
                                            message: "Withdraw under maintenance, please try after some time."
                                        } ) );
                                    }
                                } else {
                                    res.send( JSON.stringify( {
                                        status: "fail", message: "Balance not available to withdraw"
                                    } ) );
                                }
                            } else {
                                res.send( JSON.stringify( { status: "fail", message: "Please enter valid coin." } ) );
                            }
                        } else {
                            res.send( JSON.stringify( { status: "fail", message: "Please select currency type." } ) );
                        }
                    } else {
                        res.send( JSON.stringify( { status: "fail", message: "Please login" } ) );
                    }
                } else {
                    res.send( JSON.stringify( { status: "fail", message: "Please login" } ) );
                }
            } else {
                res.send( JSON.stringify( { status: "fail", message: "Please login" } ) );
            }
        } catch ( error ) {
            console.log( "Error when deposit coin add: ", error );
            res.send( JSON.stringify( {
                status: "fail", message: "Withdraw under maintenance, please try after some time."
            } ) );
        }
    };

    module.sendPayment = async function ( req, res ) {

        try {
            var reqPara = req.body;
            let coin = reqPara.amount;
            let userId = reqPara.user_id;
            var userWalletAddress = reqPara.userWalletPubKey;
            var date = new Date;

            // console.log('reqpara--> ',reqPara)
            // console.log('coin--> ',coin)
            // console.log('userId--> ',userId)
            // console.log('userWalletAddress--> ',userWalletAddress)
            // console.log('date--> ',date)

            var userDetail = await model.User.findByPk( userId ).then( userRes => {
                return userRes;
            } ).catch( err => {
                console.log( 'error userDetail => ', err );
            } );

            // console.log()

            if ( userDetail ) {
                if ( parseInt( userDetail.main_balance ) >= parseInt( coin ) ) {
                    if ( coin ) {
                        if ( userWalletAddress.length !== 0 ) {
                            try {
                                var withdrawData = {
                                    coin: coin,
                                    userWalletAddress: userWalletAddress,
                                    user_id: userId,
                                    transaction_date: date,
                                };

                                await model.Withdraw.create( withdrawData ).then( async withdraw => {
                                    await model.User.update( {
                                        total_withdraw: Sequelize.literal( 'total_withdraw + ' + coin ),
                                        main_balance: Sequelize.literal( 'main_balance - ' + coin )
                                    }, { where: { id: userId } } ).then( async userCoin => {
                                        await model.User.findByPk( userId ).then( userDetail => {
                                            req.session.user = userDetail;
                                            res.send( JSON.stringify( {
                                                status: "success",
                                                message: "Withdraw request sent successfully",
                                                data: userDetail.main_balance
                                            } ) );
                                        } );
                                    } ).catch( err => {
                                        console.log( 'error withdro urs => ', err );
                                    } );
                                } ).catch( err => {
                                    console.log( 'error withdro cr8 => ', err );
                                } );

                                var _user;
                                //Get main balance after update
                                _user = await model.User.findByPk( userId ).then( userRes => {
                                    return userRes;
                                } ).catch( function ( userErr ) {
                                    req.flash( 'error', "Error fetching your current data, please reload the page." );
                                } );
                                io.to( _user.socket_id ).emit( 'withdrawCurrentBalance', {
                                    balance: _user.main_balance, userId: userId
                                } );


                            } catch ( error ) {
                                res.send( JSON.stringify( { status: "fail", message: "Error in update balance." } ) );
                            }
                        } else {
                            res.send( JSON.stringify( {
                                status: "fail", message: "Error fetching your phantom wallet address. Please install phantom."
                            } ) );
                        }
                    } else {
                        res.send( JSON.stringify( { status: "fail", message: "Please enter amount." } ) );
                    }
                } else {
                    res.send( JSON.stringify( { status: "fail", message: "You don't have enough balance to withdraw." } ) );
                }
            } else {
                req.flash( 'error', "No result parameters where found for withdraw." );
            }
        } catch ( error ) {
            console.log( "Error when withdraw coin: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please try again." } ) );
        }
    };

    module.getWithdraws = async function ( request, response ) {

        let userId = request.session.user.id;
        let start = parseInt( request.query.start );
        let length = parseInt( request.query.length );
        let search = request.query.search.value;
        let query = {};

        if ( search != '' ) {
            query = {
                [ Op.or ]: [
                    { 'transaction_signature': { [ Op.like ]: '%' + search + '%' } },
                    { 'coin': { [ Op.like ]: '%' + search + '%' } },
                    { 'price': { [ Op.like ]: '%' + search + '%' } },
                    { 'status': { [ Op.like ]: '%' + search + '%' } },
                    { 'transaction_date': { [ Op.like ]: '%' + search + '%' } }
                ], user_id: userId
            };
        } else {
            query = { user_id: userId };
        }

        let withdrawCount = await model.Withdraw.count( { where: query } );
        let withdrawData = await model.Withdraw.findAll( { where: query, order: [ [ 'created_at', 'DESC' ] ], offset: start, limit: length, raw: true } );


        let withdrawList = new Array();
        for ( let i = 0; i < withdrawData.length; i++ ) {

            let data = {
                transaction_signature: withdrawData[ i ].transaction_signature,
                coin: withdrawData[ i ].coin,
                price: withdrawData[ i ].price,
                status: withdrawData[ i ].status,
                transaction_date: dateFormat( withdrawData[ i ].transaction_date, "mm-dd-yyyy, hh:MM:ss TT" ),
            };
            withdrawList.push( data );
        }

        let obj = {
            'draw': request.query.draw,
            'recordsTotal': withdrawCount,
            'recordsFiltered': withdrawCount,
            'data': withdrawList
        };

        return response.send( JSON.stringify( obj ) );
    };

    return module;
};