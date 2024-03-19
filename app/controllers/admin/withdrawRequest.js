// var dateformat = require("dateformat");
// import dateFormat, { masks } from "dateformat";
var dateFormat = require( 'moment' );

var currentDate = new Date();
var Op = Sequelize.Op;

module.exports = function ( model, config ) {
  var module = {};

  module.view = function ( request, response ) {
    response.render( "backend/withdrawRequest/list", {
      title: "Withdrawal Requests List",
      error: request.flash( "error" ),
      success: request.flash( "success" ),
      vErrors: request.flash( "vErrors" ),
      auth: request.session,
      config: config,
      alias: "withdraw",
      subAlias: "withdrawRequest",
    } );
  };

  module.getWithdrawRequest = async function ( request, response ) {
    var start = parseInt( request.query.start );
    var length = parseInt( request.query.length );
    var search = request.query.search.value;
    var query = { status: "Pending" };

    if ( search != "" ) {
      var withdrawCount = await model.Withdraw.count( { where: query } );
      var withdrawData = await model.Withdraw.findAll( {
        where: {
          status: "Pending",
          [ Op.or ]: [ { "$userDetail.name$": { [ Op.like ]: "%" + search + "%" } } ],
        },
        order: [ [ "id", "DESC" ] ],
        offset: start,
        limit: length,
        include: [ { model: model.User, as: "userDetail" } ],
      } );
    } else {
      var withdrawCount = await model.Withdraw.count( { where: query } );
      var withdrawData = await model.Withdraw.findAll( {
        where: query,
        order: [ [ "id", "DESC" ] ],
        offset: start,
        limit: length,
        include: [ { model: model.User, as: "userDetail" } ],
      } );
    }
    //console.log("Spam Users: ", users);
    var withdrawList = new Array();
    for ( var i = 0; i < withdrawData.length; i++ ) {
      var action = `<button
			class="btn btn-success btn-sm" id="approveTransBtn" 
			onclick="connectAndSend('${ withdrawData[ i ].userWalletAddress }','${ withdrawData[ i ].coin }','${ withdrawData[ i ].id }')"
			>Approve</button>

			<a style="margin-left:5px;" href="/backend/withdrawRequest/reject/${ withdrawData[ i ].id }" onClick="return confirm(\'Are you sure to reject this withdrawal request?\')" class="btn btn-danger btn-sm" title="Reject withdraw">Reject</a>
			`;

      var data = {
        user_name: withdrawData[ i ].userDetail.name,
        coin: withdrawData[ i ].coin,
        status: withdrawData[ i ].status,
        transaction_date: dateFormat(
          withdrawData[ i ].transaction_date,
          "mm-dd-yyyy, hh:MM:ss TT"
        ),
        editDel: action,
      };
      withdrawList.push( data );
    }

    var obj = {
      draw: request.query.draw,
      recordsTotal: withdrawCount,
      recordsFiltered: withdrawCount,
      data: withdrawList,
    };

    return response.send( JSON.stringify( obj ) );
  };

  module.approve = async function ( request, response ) {
    try {
      let transId = request.params.id;
      let transBlock = request.body.transaction_block;
      let transSign = request.body.transaction_signature;
      let transSolAmt = request.body.price;

      let transDetails = await model.Withdraw.findByPk( transId ).then(
        ( transRes ) => transRes
      );

      if ( transDetails ) {
        try {
          let transData = {
            price: transSolAmt,
            transaction_signature: transSign,
            transaction_block: transBlock,
            status: "Approved",
          };

          await transDetails.update( transData ).then( ( trans ) => {
            //   use this if want to update user coin after admins approval
            // await model.User.update(
            //   {
            //     total_withdraw: Sequelize.literal(
            //       "total_withdraw + " + coin
            //     ),
            //     main_balance: Sequelize.literal("main_balance - " + coin),
            //   },
            //   { where: { id: trans.user_id } }
            // );
          } );
          // res.json({msg:'success',data:taskData})
          response.json( { msg: 'success', data: 'Withdraw request approved' } );
          // request.flash("success", "Withdraw request approved.");
          // response.redirect("/backend/withdrawRequest");
        } catch ( error ) {
          console.log( "error >-=> ", error );
          request.flash( "error", "Error updating transaction." );
          response.redirect( "/backend/withdrawRequest" );
        }
      } else {
        console.log( "transaction not found" );
        request.flash( "error", "Transaction not found." );
        response.redirect( "/backend/withdrawRequest" );
      }
    } catch ( err ) {
      console.log( err );
      request.flash( "error", "Something went wrong. Please try again later" );
      response.redirect( "/backend/withdrawRequest" );
    }
  };

  module.reject = async function ( request, response ) {
    try {
      let transId = request.params.id;

      let transDetails = await model.Withdraw.findByPk( transId ).then(
        ( transRes ) => transRes
      );

      if ( transDetails ) {
        try {
          let transData = {
            status: "Rejected",
          };

          await transDetails.update( transData ).then( async ( trans ) => {
            await model.User.update(
              {
                total_withdraw: Sequelize.literal(
                  "total_withdraw - " + trans.coin
                ),
                main_balance: Sequelize.literal(
                  "main_balance + " + trans.coin
                ),
              },
              { where: { id: trans.user_id } }
            );
          } );

          var _user;
          //Get main balance after update
          _user = await model.User.findByPk( transDetails.user_id )
            .then( ( userRes ) => {
              return userRes;
            } )
            .catch( function ( userErr ) {
              request.flash(
                "error",
                "Error fetching your current data, please reload the page."
              );
            } );
          io.to( _user.socket_id ).emit( "withdrawCurrentBalance", {
            balance: _user.main_balance,
            userId: transDetails.user_id,
          } );

          request.flash( "success", "Withdraw request rejected." );
          response.redirect( "/backend/withdrawRequest" );
        } catch ( error ) {
          console.log( "er-> ", error );
          request.flash( "error", "Error updating transaction." );
          response.redirect( "/backend/withdrawRequest" );
        }
      } else {
        console.log( "Withdrawal details not found" );
        request.flash( "error", "Withdrawal details not found." );
        response.redirect( "/backend/withdrawRequest" );
      }
    } catch ( err ) {
      console.log( "error->", err );
      request.flash( "error", "Something went wrong please try later." );
      response.redirect( "/backend/withdrawRequest" );
    }
  };

  return module;
};
