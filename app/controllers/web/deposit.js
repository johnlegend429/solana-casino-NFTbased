// var dateFormat = require('dateformat');
var dateFormat = require( 'moment' );

var Op = Sequelize.Op;
var request = require( 'request' );
// var QRCode = require('qrcode');
// var freeKass = require('../../helpers/FreekassaHelper');
//var config = require('/config/constants.js');

module.exports = function ( model, config ) {

    var module = {};

    var options = {
        key: '124daa672390135dff492559ce511b6d453dc8a2c743b3aaa40c3b32d242628b',
        //key:'b3e6a1e19842941388e810a446085825851c046bac4b87c28ba4e3e2de539d09',
        secret: '44EEf0ab2E0Adb86309BCA919D76Db63d09De4df9bc00d48a9AB5056E96b2af0',
        //secret:'ECd2ca8b4df9e4854b10Ca8d403C9012E0e5912240088370e02bDcab1d96F762',
        autoIpn: true
    };

    // var client = new Coinpayments(options);

    var BlockchainOptions = {
        xpub: '',
        key: '',
        autoIpn: true
    };

    //var objFreeKassa = new freeKass({ firstSecret: 'rwvdkwus', secondSecret: 'a7bj19el', merchantId: '149435', walletToken: '47C9089925270BE4E1DC2588EC887419', walletId: '149435', FKwalletId: 'F106655116' });
    // var objFreeKassa = new freeKass();

    module.view = async function ( req, res ) {
        try {

            if ( req.session.user.id !== 0 ) {
                var userId = req.session.user.id;

                var userDetail = await model.User.findByPk( userId ).then( userRes => {
                    return userRes;
                } );

                // console.log('userDetail >>--<> ',userDetail)

                let setting = await model.Setting.findByPk( '1' ).then( settingRes => {
                    return settingRes;
                } );

                console.log( 'meri setting--> ', setting );

                var depositHisList = await model.Deposit.findAll( { where: { 'user_id': userId }, order: [ [ 'id', 'DESC' ], ], raw: true } ).then( historyRes => {
                    for ( var i = 0; i < historyRes.length; i++ ) {
                        var date = dateFormat( historyRes[ i ].transaction_date, 'mm/dd/yyyy' );
                        //historyRes[i].transaction_date = historyRes[i].transaction_date;
                        historyRes[ i ].transaction_date = date;
                    }
                    return historyRes;
                } );
                console.log( "depositHisList: ", depositHisList );
                if ( userDetail !== null ) {
                    res.render( 'frontend/deposit', {
                        error: req.flash( "error" ),
                        success: req.flash( "success" ),
                        vErrors: req.flash( "vErrors" ),
                        auth: req.session,
                        config: config,
                        alias: 'deposit',
                        userDetail: userDetail,
                        historyList: depositHisList,
                        adminKiSetting: setting
                    } );
                } else {
                    req.flash( 'error', "Please login." );
                    res.redirect( '/login' );
                }
            } else {
                req.flash( 'error', "Please login." );
                res.redirect( '/login' );
            }
        } catch ( error ) {
            console.log( "deposit page loading error: ", error );
            res.redirect( '/' );
        }
    };

    module.checkcoin = async function ( req, res ) {
        try {
            var coin = req.body.coin;
            var currencyType = req.body.currency_type;
            if ( currencyType !== "" && currencyType !== null && currencyType !== undefined ) {
                if ( coin !== "" && coin !== 0 ) {
                    var msg = await model.Setting.findById( 1 ).then( setting => {

                        //var amount = coin / parseFloat(setting.deposit_btc_coin);
                        //if (currencyType === "BTC") {
                        //    var amount = coin / parseFloat(setting.deposit_btc_coin);
                        //}
                        //io.emit('getUserDetail', { userId: req.session.user.id }, function (response) {
                        //    if (response.status === "success") {
                        //        userDetail = response.data;
                        //        $('.current_balance').text(userDetail.main_balance);
                        //    }
                        //});

                        //return "You need deposit " + parseFloat(amount).toFixed(5) + " " + currencyType;
                        return "You need deposit " + parseFloat( coin ).toFixed( 2 ) + " " + currencyType;

                    } ).catch( function ( settingErr ) {
                        return settingErr;
                        //return "Please deposit after sometime.";
                        //console.log("Getting site setting error: ", settingErr);
                        //res.send(JSON.stringify({ status: "fail", message: "Please deposit after sometime." }));
                    } );
                    res.send( JSON.stringify( { status: "success", message: msg } ) );

                }
            }
        } catch ( error ) {
            console.log( "Error when deposit coin check: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please select currency type." } ) );
        }
    };

    module.blockChainSuccess = async function ( req, res ) {
        try {
            var result = req.query;
            if ( result ) {
                var depositeDetail = await model.Deposit.findOne( { where: { transaction_address: result.address } } ).then( depositeRes => {
                    return depositeRes;
                } ).catch( function ( depositeErr ) {
                    console.log( "Error when user profile update get user detail: ", userErr );
                    req.flash( 'error', "Your detail not update, please try again after sometime." );
                    res.redirect( '/profile' );
                } );

                var setting = await model.Setting.findById( 1 ).then( settingRes => {
                    return settingRes;
                } ).catch( function ( settingErr ) {
                    console.log( "Error when user deposit coin get setting error: ", settingErr );
                    res.send( JSON.stringify( { status: "fail", message: "Deposit under maintenance, please try after some time." } ) );
                } );

                if ( setting !== null ) {

                    if ( depositeDetail !== null ) {

                        var updateData = {
                            price: result.value / parseFloat( setting.deposit_btc_coin ),
                            coin: result.value,
                            transaction_id: result.transaction_hash,
                            transaction_address: result.address,
                            status: 'success'
                        };

                        updateData = await depositeDetail.update( updateData ).then( updateRes => {
                            return updateRes;
                        } ).catch( function ( updateErr ) {
                            console.log( "Error when user profile update: ", updateErr );
                            req.flash( 'error', "Your detail not update, please try again" );
                            res.redirect( '/profile' );
                        } );
                    }

                    await model.User.increment( [ 'main_balance', 'total_deposite' ], { by: result.value, where: { id: depositeDetail.user_id } } );
                    res.send( JSON.stringify( { status: "success", message: "Coin deposited successfully." } ) );
                    req.flash( 'success', "Coin deposited successfully" );
                }
            }
            else {
                console.log( "No result where found in callback." );
                req.flash( 'error', "" );
            }
        } catch ( error ) {
            console.log( "Error when deposit coin check: ", error );
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
                        var currencyType = 'BTC';
                        currencyType = req.body.currency_type;
                        if ( currencyType !== null && currencyType !== "" ) {
                            if ( coin !== "" && coin !== 0 ) {
                                var setting = await model.Setting.findById( 1 ).then( settingRes => {
                                    return settingRes;
                                } ).catch( function ( settingErr ) {
                                    console.log( "Error when user deposit coin get setting error: ", settingErr );
                                    res.send( JSON.stringify( { status: "fail", message: "Deposit under maintenance, please try after some time." } ) );
                                } );

                                if ( setting !== null ) {

                                    if ( currencyType === "btc" || currencyType === "BTC" ) {
                                        var amount = coin / parseFloat( setting.deposit_btc_coin );
                                        var minDepositAmt = setting.btc_deposit_min_coin;
                                        var coinType = "BTC";
                                    }

                                    console.log( "minDepositAmt: ", minDepositAmt );

                                    var url = "https://api.blockchain.info/v2/receive?xpub=" + BlockchainOptions.xpub + "&callback=" + encodeURIComponent( 'http://arthurcrash.aistechnolabs.in/deposit/blockChainSuccess' ) + "&key=" + BlockchainOptions.key;

                                    if ( parseFloat( coin ) > parseFloat( minDepositAmt ) ) {
                                        request( url, { json: true }, ( err, response, result ) => {
                                            if ( !err ) {
                                                var now = new Date();
                                                var depostiData = {
                                                    user_id: userId,
                                                    price: amount,
                                                    coin: coin,
                                                    coin_type: coinType,
                                                    transaction_id: result.index,
                                                    transaction_address: result.address,
                                                    transaction_date: dateFormat( now, "yyyy-mm-dd HH:MM:ss" )
                                                };
                                                QRCode.toDataURL( result.address, function ( err, url ) {
                                                    console.log( url );
                                                    result.url = url;
                                                } );

                                                model.Deposit.create( depostiData ).then( depositResult => {
                                                    res.send( JSON.stringify( { status: "success", message: "Payment request send", data: result } ) );
                                                } );

                                            }
                                            else {
                                                console.log( "Error when user deposit coin payment: ", err );
                                                res.send( JSON.stringify( { status: "fail", message: err } ) );
                                            }
                                        } );

                                        //client.createTransaction({ 'currency1': currencyType, 'currency2': currencyType, 'amount': parseFloat(amount).toFixed(5), ipn_url: "http://rc.aistechnolabs.info:4446/checktra" }, function (err, result) {
                                        //    if (err == null) {
                                        //        var now = new Date();
                                        //        var depostiData = {
                                        //            user_id: userId,
                                        //            price: amount,
                                        //            coin: coin,
                                        //            coin_type: coinType,
                                        //            transaction_id: result.txn_id,
                                        //            transaction_address: result.address,
                                        //            transaction_date: dateFormat(now, "yyyy-mm-dd HH:MM:ss")
                                        //        };
                                        //        model.Deposit.create(depostiData).then(depositResult => {
                                        //            res.send(JSON.stringify({ status: "success", message: "Payment request send", data: result }));
                                        //        });
                                        //    } else {
                                        //        console.log("Error when user deposit coin payment: ", err);
                                        //        res.send(JSON.stringify({ status: "fail", message: err }));
                                        //    }
                                        //});

                                    } else {
                                        res.send( JSON.stringify( { status: "fail", message: "Minimum deposit coin is " + minDepositAmt } ) );
                                    }
                                } else {
                                    res.send( JSON.stringify( { status: "fail", message: "Deposit under maintenance, please try after some time." } ) );
                                }
                            } else {
                                res.send( JSON.stringify( { status: "fail", message: "Please enter valid coin." } ) );
                            }
                        } else {
                            res.send( JSON.stringify( { status: "fail", message: "Withdraw under maintenance, please try after some time." } ) );
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
            res.send( JSON.stringify( { status: "fail", message: "Deposit under maintenance, please try after some time." } ) );
        }
    };

    /* Free-kassa Callback url methods*/

    module.GetWithdrawForm = async function ( req, res ) {
        try {
            var reqPara = req.query;
            var date = new Date;
            var amount = reqPara.amount;
            var orderNo = reqPara.user_id + "_" + reqPara.amount + "_" + date.getDay() + "_" + date.getMonth() + "_" + date.getFullYear() + "_" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
            if ( amount ) {
                var fromHTML = await objFreeKassa.getWithdrawObj( amount, orderNo, reqPara.user_id );

                res.send( JSON.stringify( { status: "success", message: "Withdraw object created.", fromHTML } ) );
            }
            else {
                console.log( "No result parameters where found deposit." );
                req.flash( 'error', "No result parameters where found deposit." );
            }
        } catch ( error ) {
            console.log( "Error when deposit get from: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please try again." } ) );
        }
    };

    module.GetDepositeForm = async function ( req, res ) {
        /* For getting payment form*/
        //try {
        //    var reqPara = req.query;
        //    var date = new Date;
        //    var dolar = reqPara.dolar;
        //    var orderNo = reqPara.user_id + "_" + reqPara.dolar + "_" + date.getDay() + "_" + date.getMonth() + "_" + date.getFullYear() + "_" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
        //    if (dolar) {
        //        var fromHTML = await objFreeKassa.getForm(dolar, orderNo);
        //        res.send(JSON.stringify({ status: "success", message: "Deposit under maintenance, please try after some time.", url: fromHTML }));
        //    }
        //    else {
        //        console.log("No result parameters where found deposit.");
        //        req.flash('error', "No result parameters where found deposit.");
        //    }
        //} catch (error) {
        //    console.log("Error when deposit get from: ", error);
        //    res.send(JSON.stringify({ status: "fail", message: "Please try again." }));
        //}

        /*For getting payment widget*/

        try {
            var reqPara = req.query;
            var date = new Date;
            var amount = reqPara.amount;
            var orderNo = reqPara.user_id + "_" + reqPara.amount + "_" + date.getDay() + "_" + date.getMonth() + "_" + date.getFullYear() + "_" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
            if ( amount ) {
                var fromHTML = await objFreeKassa.getDepositObj( amount, orderNo, reqPara.user_id );
                res.send( JSON.stringify( { status: "success", message: "Deposit object created.", fromHTML } ) );
            }
            else {
                console.log( "No result parameters where found deposit." );
                req.flash( 'error', "No result parameters where found deposit." );
            }
        } catch ( error ) {
            console.log( "Error when deposit get from: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please try again." } ) );
        }
    };

    // module.paymentsuccess = async function (req, res) {
    //     req.flash('success', "Payment Received.");
    //     res.redirect('/deposit');
    //     //io.emit('MessageAndRedirect', { Message: 'Payment Received.', URL: '/deposit' });
    //     //console.log("Call Free-kassa success method");
    // };

    module.paymentfail = async function ( req, res ) {
        req.flash( 'error', "Payment fail. Please try again!" );
        res.redirect( '/deposit' );
    };

    module.freekassaalert = async function ( req, res ) {
        try {
            var result = req.body;
            if ( result ) {
                //Get userId from mearchant ID
                var MERCHANT_ORDER_ID = result.MERCHANT_ORDER_ID.split( '_' );
                var userId = MERCHANT_ORDER_ID[ 0 ];

                // Get admin setting
                var setting = await model.Setting.findById( 1 ).then( settingRes => {
                    return settingRes;
                } ).catch( function ( settingErr ) {
                    console.log( "Error when user deposit coin get setting error: ", settingErr );
                    res.send( JSON.stringify( { status: "fail", message: "Deposit under maintenance, please try after some time." } ) );
                } );

                var _date = new Date();

                //Bind deposite object
                if ( setting !== null ) {
                    var updateData = {
                        price: result.AMOUNT,
                        coin: result.AMOUNT,
                        coin_type: result.CUR_ID,
                        transaction_id: result.intid,
                        transaction_address: result.SIGN,
                        user_id: userId,
                        transaction_date: _date,
                        status: 'success'
                    };

                    //Insert object into DB
                    updateData = await model.Deposit.create( updateData ).then( updateRes => {
                        return updateRes;
                    } ).catch( function ( updateErr ) {
                        console.log( "Error when user profile update: ", updateErr );
                        req.flash( 'error', "Your detail not update, please try again" );
                        res.redirect( '/profile' );
                    } );

                    //Update 
                    await model.User.increment( [ 'main_balance', 'total_deposite' ], { by: result.AMOUNT, where: { id: userId } } );
                    // res.send(JSON.stringify({ status: "success", message: "Coin deposited successfully." }));
                    //req.flash('success', "Coin deposited successfully");

                    //Get main balance after update
                    // Get admin setting
                    var _user = await model.User.findByPk( userId ).then( userRes => {
                        return userRes;
                    } ).catch( function ( userErr ) {
                        console.log( "Error when getting letest result : ", userErr );
                        res.send( JSON.stringify( { status: "fail", message: "user balance update later, please try after some time." } ) );
                    } );
                    io.to( _user.socket_id ).emit( 'currentBalance', { balance: _user.main_balance, userId: userId } );
                }
            }
            else {
                console.log( "No result where found in callback." );
                req.flash( 'error', "" );
            }
        } catch ( error ) {
            console.log( "Error when deposit coin check: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please select currency type." } ) );
        }
    };


    module.paymentsuccess = async function ( req, res ) {
        try {
            let userId = req.session.user.id;
            let { transaction_block, transaction_signature, coin, price, userWalletAddress } = req.body;
            var date = new Date;

            var userDetail = await model.User.findByPk( userId ).then( userRes => {
                return userRes;
            } );

            if ( userDetail ) {
                if ( coin ) {
                    if ( userWalletAddress.length !== 0 ) {
                        try {
                            var depositData = {
                                transaction_block,
                                transaction_signature,
                                coin: coin,
                                price: price,
                                userWalletAddress,
                                user_id: userId,
                                transaction_date: date,
                            };

                            await model.Deposit.create( depositData ).then( async deposit => {
                                await model.User.update( {
                                    // total_withdraw: Sequelize.literal('total_withdraw + ' + coin),
                                    // main_balance: Sequelize.literal('main_balance - ' + coin)
                                    main_balance: Sequelize.literal( 'main_balance + ' + coin ),
                                    total_deposite: Sequelize.literal( 'total_deposite + ' + coin ),
                                }, { where: { id: userId } } ).catch( err => {
                                    console.log( 'error usr dep => ', err );
                                } );
                            } ).catch( err => {
                                console.log( 'error depo => ', err );
                            } );

                            var _user;
                            //Get main balance after update
                            _user = await model.User.findByPk( userId ).then( userRes => {
                                return userRes;
                            } ).catch( function ( userErr ) {
                                req.flash( 'error', "Error fetching your current data, please reload the page." );
                            } );

                            io.to( _user.socket_id ).emit( 'currentBalance', { balance: _user.main_balance, userId: userId } );
                            res.redirect( '/deposit' );



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
                req.flash( 'error', "User details not found." );
            }
        } catch ( error ) {
            console.log( "Error in deposit update: ", error );
            res.send( JSON.stringify( { status: "fail", message: "Please try again." } ) );

        }



        // req.flash('success', "Payment Received.");
        // res.redirect('/deposit');

    };

    module.getDeposits = async function ( request, response ) {

        let userId = request.session.user.id;
        let start = parseInt( request.query.start );
        let length = parseInt( request.query.length );
        let search = request.query.search.value;
        let query = { user_id: userId };

        if ( search != '' ) {
            query = {
                [ Op.or ]: [
                    { 'transaction_signature': { [ Op.like ]: '%' + search + '%' } },
                    { 'coin': { [ Op.like ]: '%' + search + '%' } },
                    { 'price': { [ Op.like ]: '%' + search + '%' } },
                    { 'transaction_date': { [ Op.like ]: '%' + search + '%' } }
                ], user_id: userId
            };
        } else {
            query = { user_id: userId };
        }


        let depositCount = await model.Deposit.count( { where: query } );
        let depositData = await model.Deposit.findAll( { where: query, order: [ [ 'id', 'DESC' ] ], offset: start, limit: length, raw: true } );

        //console.log("Spam Users: ", users);
        let depositList = new Array();
        for ( let i = 0; i < depositData.length; i++ ) {

            let data = {
                transaction_signature: depositData[ i ].transaction_signature,
                coin: depositData[ i ].coin,
                price: depositData[ i ].price,
                transaction_date: dateFormat( depositData[ i ].transaction_date, "mm-dd-yyyy, hh:MM:ss TT" ),
            };
            depositList.push( data );
        }

        let obj = {
            'draw': request.query.draw,
            'recordsTotal': depositCount,
            'recordsFiltered': depositCount,
            'data': depositList
        };

        return response.send( JSON.stringify( obj ) );
    };

    return module;
};

